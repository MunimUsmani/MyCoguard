require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 5000;
const ROOT_DIR = path.join(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PNG, JPG, and JPEG files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function cleanupFile(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete upload:", err.message);
    }
  });
}

function getPythonExecutable() {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }

  if (process.platform === "win32") {
    return path.join(ROOT_DIR, ".venv", "Scripts", "python.exe");
  }

  return path.join(ROOT_DIR, ".venv", "bin", "python");
}

function getRiskLevel(score) {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function getRecommendation(riskLevel) {
  if (riskLevel === "HIGH") {
    return "Deploy bio-filters immediately in this runoff zone.";
  }
  if (riskLevel === "MEDIUM") {
    return "Monitor closely and pre-stage bio-filters.";
  }
  return "No urgent deployment needed right now.";
}

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  let imgPath = null;
  let responded = false;

  const safeReply = (statusCode, payload) => {
    if (responded) return;
    responded = true;
    cleanupFile(imgPath);
    return res.status(statusCode).json(payload);
  };

  try {
    if (!req.file) {
      return safeReply(400, { error: "No image uploaded" });
    }

    imgPath = req.file.path;

    const pythonExecutable = getPythonExecutable();
    const pythonScript = path.join(ROOT_DIR, "ai", "analyze.py");

    console.log("----- /api/analyze -----");
    console.log("Python executable:", pythonExecutable);
    console.log("Python script:", pythonScript);
    console.log("MODEL_ARCH:", process.env.MODEL_ARCH);
    console.log("MODEL_PATH:", process.env.MODEL_PATH);
    console.log("Image path:", imgPath);

    const python = spawn(pythonExecutable, [pythonScript, imgPath], {
      cwd: ROOT_DIR,
      env: process.env
    });

    let result = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("PYTHON STDERR:", data.toString());
    });

    python.on("error", (err) => {
      console.error("PYTHON SPAWN ERROR:", err);
      return safeReply(500, {
        error: "Python process failed to start",
        details: err.message
      });
    });

    python.on("close", (code) => {
      console.log("Python exit code:", code);
      console.log("Python stdout:", result);
      console.log("Python stderr:", errorOutput);

      if (responded) return;

      if (code !== 0) {
        return safeReply(500, {
          error: "AI processing failed",
          details: errorOutput || result || `Python exited with code ${code}`
        });
      }

      try {
        const parsed = JSON.parse(result);

        if (parsed.error) {
          return safeReply(500, parsed);
        }

        return safeReply(200, parsed);
      } catch (err) {
        return safeReply(500, {
          error: "Invalid AI output",
          raw: result,
          details: err.message
        });
      }
    });
  } catch (err) {
    console.error("ANALYZE ROUTE ERROR:", err);
    return safeReply(500, {
      error: "AI processing failed",
      details: err.message
    });
  }
});

app.post("/api/storm-risk", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: "lat and lng are required"
      });
    }

    const forecastResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lng,
        current: "temperature_2m,rain,wind_speed_10m",
        hourly: "precipitation",
        daily: "precipitation_sum,temperature_2m_max,temperature_2m_min",
        forecast_days: 5,
        timezone: "auto"
      }
    });

    const climateResponse = await axios.get("https://climate-api.open-meteo.com/v1/climate", {
      params: {
        latitude: lat,
        longitude: lng,
        start_year: 2025,
        end_year: 2050,
        models: "CMCC_CM2_VHR4",
        daily: "temperature_2m_mean"
      }
    });

    const forecastData = forecastResponse.data;
    const climateData = climateResponse.data;

    const hourlyRain = forecastData.hourly?.precipitation || [];
    const next24hRain = hourlyRain.slice(0, 24).reduce((sum, val) => sum + (val || 0), 0);

    const dailyRain = forecastData.daily?.precipitation_sum || [];
    const next5dRain = dailyRain.reduce((sum, val) => sum + (val || 0), 0);

    const currentTemp = forecastData.current?.temperature_2m ?? null;
    const currentRain = forecastData.current?.rain ?? 0;
    const windSpeed = forecastData.current?.wind_speed_10m ?? 0;

    const climateTemps = climateData.daily?.temperature_2m_mean || [];
    const firstYearTemps = climateTemps.slice(0, 365);
    const lastYearTemps = climateTemps.slice(-365);

    const currentAvgTemp =
      firstYearTemps.length > 0
        ? firstYearTemps.reduce((a, b) => a + b, 0) / firstYearTemps.length
        : null;

    const futureAvgTemp2050 =
      lastYearTemps.length > 0
        ? lastYearTemps.reduce((a, b) => a + b, 0) / lastYearTemps.length
        : null;

    let riskScore = 0;

    if (next24hRain > 20) riskScore += 35;
    else if (next24hRain > 10) riskScore += 20;

    if (next5dRain > 50) riskScore += 25;
    else if (next5dRain > 25) riskScore += 15;

    if (windSpeed > 25) riskScore += 10;
    else if (windSpeed > 15) riskScore += 5;

    if (currentRain > 3) riskScore += 10;

    if (
      currentAvgTemp !== null &&
      futureAvgTemp2050 !== null &&
      futureAvgTemp2050 - currentAvgTemp > 2
    ) {
      riskScore += 20;
    } else if (
      currentAvgTemp !== null &&
      futureAvgTemp2050 !== null &&
      futureAvgTemp2050 - currentAvgTemp > 1
    ) {
      riskScore += 10;
    }

    const riskLevel = getRiskLevel(riskScore);

    res.json({
      location: { lat, lng },
      current: {
        temperature_c: currentTemp,
        rain_mm: currentRain,
        wind_speed_kmh: windSpeed
      },
      forecast: {
        next24h_rain_mm: Number(next24hRain.toFixed(2)),
        next5d_rain_mm: Number(next5dRain.toFixed(2))
      },
      climate: {
        current_avg_temp_c:
          currentAvgTemp !== null ? Number(currentAvgTemp.toFixed(2)) : null,
        future_avg_temp_2050_c:
          futureAvgTemp2050 !== null ? Number(futureAvgTemp2050.toFixed(2)) : null
      },
      riskScore,
      riskLevel,
      recommendation: getRecommendation(riskLevel)
    });
  } catch (err) {
    console.error("STORM RISK ERROR:", err.message);
    res.status(500).json({
      error: "storm risk API failed",
      details: err.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "MycoGuard API running"
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use((err, req, res, next) => {
  if (err) {
    console.error("MIDDLEWARE ERROR:", err.message);
    return res.status(400).json({
      error: err.message || "Upload failed"
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
