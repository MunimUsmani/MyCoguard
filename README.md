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
