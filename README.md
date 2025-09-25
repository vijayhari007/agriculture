# AgriTech - Fertilizer Recommendation System

A full-stack web application for recommending fertilizers based on soil parameters and crop requirements. Includes curated datasets, a Flask backend API with a rule-based engine (and optional ML model), and a modern React frontend with Tailwind CSS.

## Project Structure

```
fertilizer-recommendation-system/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── datasets/
│   ├── soil_data.csv
│   ├── crop_data.csv
│   ├── fertilizer_data.csv
│   └── training_data.csv (generated after model training)
├── docs/
├── frontend/
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── favicon.svg
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css
│       ├── components/
│       │   └── Navbar.js
│       └── pages/
│           ├── Home.js
│           ├── Recommendation.js
│           ├── SoilAnalysis.js
│           ├── Dashboard.js
│           └── About.js
└── models/
    └── train_model.py
```

## Prerequisites

- Python 3.9+ (recommend) and pip
- Node.js 16+ and npm
- Windows OS (commands shown for Windows PowerShell)

## 1) Backend Setup (Flask API)

1. Create and activate a virtual environment (recommended):

```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

3. (Optional) Train ML model to enhance recommendations. This will generate `models/fertilizer_model.pkl` and encoders:

```powershell
python models/train_model.py
```

4. Run the Flask API:

```powershell
python backend/app.py
```

- API runs on http://localhost:5000
- Endpoints:
  - GET `/` – API info
  - POST `/api/recommend` – fertilizer recommendations
  - GET `/api/crops` – list of crops
  - GET `/api/fertilizers` – list of fertilizers
  - POST `/api/soil-analysis` – soil health analysis
  - GET `/api/stats` – dashboard stats

## 2) Frontend Setup (React + Tailwind)

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Start the development server (ensure backend is running on port 5000):

```powershell
npm start
```

- Frontend runs on http://localhost:3000
- It calls the backend at `http://localhost:5000` (hardcoded in API calls).

## Using the App

- Navigate to `Home` to see an overview
- Go to `Recommendation` to input soil and crop details and get fertilizer suggestions
- Use `Soil Analysis` for a detailed soil health report
- Check `Dashboard` for analytics and sample visualizations

## Datasets Included

- `datasets/soil_data.csv` – Example soil records with pH, N, P, K, OM, moisture, temperature, location
- `datasets/crop_data.csv` – Crop requirements including N, P, K, pH range, climate, duration
- `datasets/fertilizer_data.csv` – Fertilizer compositions, types, dosage, and suitability

## Notes

- The rule-based engine in `backend/app.py` works out of the box.
- Training the ML model is optional; if a trained model is found at `models/fertilizer_model.pkl`, it can be loaded to augment recommendations in future enhancements.
- For production, consider adding proper error handling, authentication, environment config, and a database.

## Troubleshooting

- If CORS errors occur, ensure Flask is running and `Flask-CORS` is installed (already included) and that the ports are correct.
- If Tailwind styles don’t apply, confirm `index.css` includes Tailwind directives and that `tailwind.config.js` content paths cover `src/**/*`.

## License

For educational and project/demo use. Verify fertilizer dosages with local agronomy experts before field application.
