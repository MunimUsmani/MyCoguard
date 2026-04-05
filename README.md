# 🌿 MYCOGUARD

**MycoGuard** is an AI-powered environmental monitoring and mycelium health analysis platform.

It combines:
- **Storm risk prediction** using weather + climate APIs
- **Mycelium filter image analysis** using a trained deep learning model
- A clean **web dashboard** for field use

The platform helps identify:
- where myco-filters should be deployed
- whether a deployed mycelium filter is healthy
- whether it is degrading
- whether it should be replaced immediately

---

## ✨ Features

- **Storm Sentry**
  - Select any point on the map
  - Analyze runoff danger using forecast and climate projections
  - Get deployment recommendations

- **Myco-Scanner AI**
  - Upload an image of a deployed mycelium filter
  - Detect:
    - `healthy`
    - `degrading`
    - `replace_now`
  - Returns confidence, efficiency estimate, and field recommendation

- **Climate Projection Snapshot**
  - Shows current average temperature
  - Shows projected future average temperature
  - Displays warming delta

---

## 🧱 Tech Stack

### Frontend
- HTML
- Tailwind CSS
- JavaScript
- Leaflet.js

### Backend
- Node.js
- Express.js
- Multer
- Axios
- Dotenv

### AI / ML
- Python
- PyTorch
- Torchvision
- Pillow
- NumPy

### Deployment
- Railway

---

## 📁 Project Structure

```bash
MYCOGUARD-MAIN/
├── ai/
│   ├── analyze.py
│   ├── model.py
│   ├── mycoguard_cnn.py
│   └── requirements.txt
│
├── backend/
│   ├── uploads/
│   ├── .env
│   ├── climate.js
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── weather.js
│
├── frontend/
│   └── index.html
│
├── model/
│   └── mycoguard_best_efficientnet.pth
│
├── .dockerignore
├── nixpacks.toml
├── railway.json
└── README.md


🧠 How the Project Works

MycoGuard has three connected parts:

1. Frontend dashboard

The frontend is a static UI served by Express.

It allows the user to:

choose a point on the map
request storm-risk analysis
upload a mycelium image
view AI prediction results

The frontend sends requests to these API routes:

POST /api/storm-risk
POST /api/analyze
2. Backend API

The backend handles:

serving the frontend
receiving image uploads
calling external weather and climate APIs
spawning Python for model inference
returning JSON to the frontend

The backend is built with Express.js.

3. Python ML inference

When an image is uploaded:

Express stores it temporarily in backend/uploads/
Node spawns a Python process
Python runs ai/analyze.py
analyze.py loads the trained .pth model
the model predicts one of the 3 classes
JSON output is returned to the frontend
🚀 Local Setup

Below is the full setup flow, with each step explaining what it does and why it matters.

Step 1: Clone the repository

This downloads the full project to your machine.

git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd MYCOGUARD-MAIN
Step 2: Understand what needs to run

Before setup, it helps to know what the app needs:

Node.js runs the backend API
Python runs the ML model inference
PyTorch loads the trained .pth file
The frontend is served by Express from the backend

So locally, you will run one backend server, and that server will:

serve the frontend
serve the API
call Python when image analysis is requested
Step 3: Create a Python virtual environment

This creates an isolated Python environment for ML dependencies.

It keeps your project dependencies separate from your system Python.

Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1
Windows CMD
python -m venv .venv
.venv\Scripts\activate

After activation, your terminal should show something like:

(.venv)
Step 4: Install Python dependencies

This installs the Python packages required for model inference.

These are used by:

analyze.py
model.py
PyTorch model loading
image preprocessing
pip install --upgrade pip
pip install -r ai/requirements.txt
Step 5: Install backend dependencies

Now install the Node.js packages used by Express and the API server.

These handle:

HTTP routes
file uploads
API calls
environment variables
cd backend
npm install
cd ..
Step 6: Add your environment variables

Create this file:

backend/.env

Add:

PORT=5000
MODEL_ARCH=efficientnet_b0
MODEL_PATH=model/mycoguard_best_efficientnet.pth
PYTHON_PATH=python3
What each variable does
PORT

The backend server will run on this port locally.

MODEL_ARCH

Tells the Python code which architecture to build before loading weights.

Example:

MODEL_ARCH=efficientnet_b0
MODEL_PATH

Points to the trained model file.

Example:

MODEL_PATH=model/mycoguard_best_efficientnet.pth
PYTHON_PATH

Tells Node which Python executable to run when spawning analyze.py.

Locally, python3 is usually enough.

Step 7: Add the trained model file

The ML system cannot work without the trained model.

Place your trained .pth file in:

model/mycoguard_best_efficientnet.pth

This file is loaded by:

ai/analyze.py

If the file path or model architecture is wrong, image analysis will fail.

Step 8: How image analysis works internally

When you upload an image from the UI:

frontend sends image to:

POST /api/analyze

backend saves it temporarily in:

backend/uploads/

backend starts Python:

ai/analyze.py
Python:
reads the uploaded image
preprocesses it
loads the trained model
predicts class probabilities
returns JSON
backend sends the result back to the browser

Expected classes:

["healthy", "degrading", "replace_now"]
Step 9: How storm-risk analysis works internally

When you select a location on the map:

frontend sends latitude and longitude to:

POST /api/storm-risk
backend calls:
Open-Meteo forecast API
Open-Meteo climate API
backend calculates:
next 24h rainfall
next 5-day rainfall
current temperature/rain/wind
future climate stress
total risk score
backend returns:
current weather
forecast totals
climate summary
risk level
deployment recommendation
Step 10: Start the backend

Run the backend from the backend folder:

cd backend
node server.js

For development with auto-restart:

npm run dev
Step 11: Open the application

Once the backend is running, open:

http://localhost:5000

This is important.

Do not open the frontend separately with Live Server, because the backend already serves the frontend and API together.

🏋️ Model Training

The model was trained separately in notebook / Colab and exported as a .pth file.

Typical save command:

torch.save(model.state_dict(), "/content/mycoguard_best_efficientnet.pth")

Then move the downloaded file into:

model/mycoguard_best_efficientnet.pth
📡 API Endpoints
POST /api/storm-risk
Request
{
  "lat": 24.8607,
  "lng": 67.0011
}
Response
{
  "location": {
    "lat": 24.8607,
    "lng": 67.0011
  },
  "current": {
    "temperature_c": 31.2,
    "rain_mm": 0,
    "wind_speed_kmh": 12
  },
  "forecast": {
    "next24h_rain_mm": 3.2,
    "next5d_rain_mm": 12.4
  },
  "climate": {
    "current_avg_temp_c": 29.1,
    "future_avg_temp_2050_c": 30.8
  },
  "riskScore": 25,
  "riskLevel": "LOW",
  "recommendation": "No urgent deployment needed right now."
}
POST /api/analyze
Form-data
image=<uploaded file>
Response
{
  "status": "degrading",
  "efficiency": 0.58,
  "risk": "medium",
  "confidence": 0.74,
  "message": "Filter is degrading. Monitor closely and replace soon."
}
☁️ Railway Deployment

This project is configured for Railway deployment.

Railway Variables

Set these:

MODEL_ARCH=efficientnet_b0
MODEL_PATH=model/mycoguard_best_efficientnet.pth
PYTHON_PATH=python3

Railway provides PORT automatically, so you usually do not need to define it manually there.

Deployment Flow
1. Push project to GitHub

Make sure these are committed:

backend
frontend
ai
model
nixpacks.toml
railway.json
2. Connect GitHub repo to Railway
3. Railway builds:
Node.js dependencies
Python environment
PyTorch requirements
4. Railway starts:
cd backend && npm start
5. Express serves:
frontend dashboard
API routes
🛠 Troubleshooting
Python process failed to start

Possible reasons:

Python not available
wrong PYTHON_PATH
Railway runtime issue
Fix

Use:

PYTHON_PATH=python3
AI processing failed

Possible reasons:

wrong model path
wrong model architecture
bad .pth file
Python dependency issue

Check:

MODEL_ARCH=efficientnet_b0
MODEL_PATH=model/mycoguard_best_efficientnet.pth
libstdc++.so.6 error on Railway

PyTorch needs native shared libraries.

Fix

Make sure your nixpacks.toml includes the correct runtime libraries.

Frontend loads but APIs fail locally

Make sure you open:

http://localhost:5000

not a separate Live Server page.

🔮 Future Improvements
user authentication
inference history
batch image analysis
analytics dashboard
ONNX / TorchScript optimization
retraining pipeline
admin panel
👨‍💻 Author

Built by Munim Usmani

If you liked the project, consider starring the repo.
