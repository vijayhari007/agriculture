from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
import json
import requests
from dotenv import load_dotenv
from io import BytesIO
import base64
from PIL import Image

load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from the frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Load datasets and model
def load_data():
    try:
        # Resolve project root based on this file's location
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        datasets_dir = os.path.join(project_root, 'datasets')
        models_dir = os.path.join(project_root, 'models')

        # Load datasets
        soil_csv = os.path.join(datasets_dir, 'soil_data.csv')
        crop_csv = os.path.join(datasets_dir, 'crop_data.csv')
        fertilizer_csv = os.path.join(datasets_dir, 'fertilizer_data.csv')

        soil_data = pd.read_csv(soil_csv)
        crop_data = pd.read_csv(crop_csv)
        fertilizer_data = pd.read_csv(fertilizer_csv)
        
        # Load trained model if exists
        model_path = os.path.join(models_dir, 'fertilizer_model.pkl')
        model = joblib.load(model_path) if os.path.exists(model_path) else None
            
        return soil_data, crop_data, fertilizer_data, model
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None, None, None

# Initialize data
soil_data, crop_data, fertilizer_data, model = load_data()

@app.route('/')
def home():
    return jsonify({
        "message": "Fertilizer Recommendation System API",
        "version": "1.0.0",
        "endpoints": {
            "/api/recommend": "POST - Get fertilizer recommendations",
            "/api/crops": "GET - Get all available crops",
            "/api/fertilizers": "GET - Get all available fertilizers",
            "/api/soil-analysis": "POST - Analyze soil conditions",
            "/api/stats": "GET - Get system statistics"
        }
    })

@app.route('/api/recommend', methods=['POST'])
def recommend_fertilizer():
    try:
        data = request.get_json()
        
        # Extract input parameters
        crop_type = data.get('crop_type')
        soil_name = data.get('soil_name', '')  # free text, optional
        soil_type = data.get('soil_type', '').lower()  # e.g., red, black, alluvial, sandy, clay, loam, laterite
        soil_ph = float(data.get('soil_ph', 7.0))
        nitrogen = float(data.get('nitrogen', 0))
        phosphorus = float(data.get('phosphorus', 0))
        potassium = float(data.get('potassium', 0))
        organic_matter = float(data.get('organic_matter', 2.5))
        moisture = float(data.get('moisture', 50))
        temperature = float(data.get('temperature', 25))
        
        # Rule-based recommendation system
        recommendations = get_fertilizer_recommendations(
            crop_type=crop_type,
            soil_ph=soil_ph,
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            organic_matter=organic_matter,
            moisture=moisture,
            temperature=temperature,
            soil_type=soil_type,
            soil_name=soil_name
        )
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "input_parameters": data,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

def get_fertilizer_recommendations(crop_type, soil_ph, nitrogen, phosphorus, potassium, organic_matter, moisture, temperature, soil_type="", soil_name=""):
    """Rule-based fertilizer recommendation system with soil type awareness"""
    
    recommendations = []
    
    # Crop-specific nutrient requirements
    crop_requirements = {
        'rice': {'N': 120, 'P': 60, 'K': 40, 'ph_range': (5.5, 6.5)},
        'wheat': {'N': 150, 'P': 80, 'K': 60, 'ph_range': (6.0, 7.5)},
        'corn': {'N': 180, 'P': 90, 'K': 80, 'ph_range': (6.0, 7.0)},
        'soybean': {'N': 50, 'P': 70, 'K': 100, 'ph_range': (6.0, 7.0)},
        'cotton': {'N': 120, 'P': 60, 'K': 80, 'ph_range': (5.8, 8.0)},
        'tomato': {'N': 200, 'P': 100, 'K': 150, 'ph_range': (6.0, 7.0)},
        'potato': {'N': 150, 'P': 80, 'K': 200, 'ph_range': (5.2, 6.4)},
        'sugarcane': {'N': 250, 'P': 75, 'K': 100, 'ph_range': (6.0, 7.5)}
    }
    
    if crop_type.lower() not in crop_requirements:
        return [{"type": "error", "message": "Crop type not supported"}]
    
    req = crop_requirements[crop_type.lower()]
    
    # Calculate nutrient deficiencies
    n_deficit = max(0, req['N'] - nitrogen)
    p_deficit = max(0, req['P'] - phosphorus)
    k_deficit = max(0, req['K'] - potassium)

    # Soil type traits to adjust recommendations
    soil_traits = {
        'sandy': {
            'notes': 'Sandy soils leach N and K faster; split applications recommended',
            'prefer_k': 'Sulfate of Potash (0-0-50)',
            'organic': True,
            'ph_bias': 0.0
        },
        'clay': {
            'notes': 'Clay soils may fix P; consider band placement and organic matter',
            'prefer_p': 'DAP (18-46-0)',
            'organic': True,
            'ph_bias': 0.1
        },
        'loam': {
            'notes': 'Loam soils are generally balanced; maintain with NPK',
            'prefer_balanced': 'NPK (10-10-10)',
            'organic': False,
            'ph_bias': 0.0
        },
        'red': {
            'notes': 'Red soils often low in N and OM',
            'organic': True,
            'ph_bias': -0.1
        },
        'black': {
            'notes': 'Black (vertisol) soils may be slightly alkaline; monitor Zn and S',
            'micronutrient': 'Zinc Sulfate',
            'ph_bias': 0.2
        },
        'alluvial': {
            'notes': 'Alluvial soils moderately fertile; balanced NPK works well',
            'prefer_balanced': 'NPK (10-10-10)',
            'ph_bias': 0.0
        },
        'laterite': {
            'notes': 'Laterite soils are acidic and low in bases; lime and OM helpful',
            'organic': True,
            'ph_bias': -0.2
        }
    }

    traits = soil_traits.get(soil_type, {}) if soil_type else {}

    # pH recommendations (adjust awareness based on soil type bias)
    ph_min, ph_max = req['ph_range']
    # Adjust target slightly by soil_type bias
    adj_ph_min = ph_min + traits.get('ph_bias', 0.0)
    adj_ph_max = ph_max + traits.get('ph_bias', 0.0)

    if soil_ph < adj_ph_min:
        recommendations.append({
            "type": "pH_adjustment",
            "product": "Lime (CaCO3)",
            "quantity": f"{(adj_ph_min - soil_ph) * 500:.0f} kg/hectare",
            "reason": f"Soil pH ({soil_ph}) is too acidic for {crop_type}. Target pH: {ph_min}-{ph_max}",
            "priority": "high"
        })
    elif soil_ph > adj_ph_max:
        recommendations.append({
            "type": "pH_adjustment", 
            "product": "Sulfur or Aluminum Sulfate",
            "quantity": f"{(soil_ph - adj_ph_max) * 300:.0f} kg/hectare",
            "reason": f"Soil pH ({soil_ph}) is too alkaline for {crop_type}. Target pH: {ph_min}-{ph_max}",
            "priority": "high"
        })
    
    # Nitrogen recommendations
    if n_deficit > 50:
        recommendations.append({
            "type": "primary_nutrient",
            "product": "Urea (46-0-0)",
            "quantity": f"{n_deficit * 2.17:.0f} kg/hectare",
            "reason": f"Nitrogen deficiency: {n_deficit:.0f} kg/ha needed",
            "priority": "high"
        })
    elif n_deficit > 20:
        recommendations.append({
            "type": "primary_nutrient",
            "product": "Ammonium Sulfate (21-0-0)",
            "quantity": f"{n_deficit * 4.76:.0f} kg/hectare",
            "reason": f"Moderate nitrogen deficiency: {n_deficit:.0f} kg/ha needed",
            "priority": "medium"
        })
    
    # Phosphorus recommendations
    if p_deficit > 30:
        recommendations.append({
            "type": "primary_nutrient",
            "product": "Triple Super Phosphate (0-46-0)",
            "quantity": f"{p_deficit * 2.17:.0f} kg/hectare",
            "reason": f"Phosphorus deficiency: {p_deficit:.0f} kg/ha needed",
            "priority": "high"
        })
    elif p_deficit > 10:
        recommendations.append({
            "type": "primary_nutrient",
            "product": "DAP (18-46-0)",
            "quantity": f"{p_deficit * 2.17:.0f} kg/hectare",
            "reason": f"Moderate phosphorus deficiency: {p_deficit:.0f} kg/ha needed",
            "priority": "medium"
        })
    
    # Potassium recommendations (prefer SOP on sandy soils or chloride-sensitive scenarios)
    if k_deficit > 40:
        recommendations.append({
            "type": "primary_nutrient",
            "product": traits.get('prefer_k', "Muriate of Potash (0-0-60)"),
            "quantity": f"{k_deficit * 1.67:.0f} kg/hectare",
            "reason": f"Potassium deficiency: {k_deficit:.0f} kg/ha needed",
            "priority": "high"
        })
    elif k_deficit > 15:
        recommendations.append({
            "type": "primary_nutrient",
            "product": traits.get('prefer_k', "Sulfate of Potash (0-0-50)"),
            "quantity": f"{k_deficit * 2:.0f} kg/hectare",
            "reason": f"Moderate potassium deficiency: {k_deficit:.0f} kg/ha needed",
            "priority": "medium"
        })
    
    # Organic matter recommendations
    if organic_matter < 2.0:
        recommendations.append({
            "type": "organic",
            "product": "Compost or Farm Yard Manure",
            "quantity": "5-10 tons/hectare",
            "reason": f"Low organic matter ({organic_matter}%). Improve soil health and nutrient retention",
            "priority": "medium"
        })
    
    # Micronutrient recommendations based on crop and soil conditions
    if crop_type.lower() in ['rice', 'wheat'] and soil_ph > 7.5:
        recommendations.append({
            "type": "micronutrient",
            "product": "Zinc Sulfate",
            "quantity": "25 kg/hectare",
            "reason": "High pH can cause zinc deficiency in cereals",
            "priority": "medium"
        })
    
    if crop_type.lower() in ['tomato', 'potato'] and soil_ph > 7.0:
        recommendations.append({
            "type": "micronutrient",
            "product": "Iron Chelate",
            "quantity": "10 kg/hectare",
            "reason": "Alkaline soil can cause iron deficiency in vegetables",
            "priority": "medium"
        })
    
    # Soil-type driven micronutrient or organic matter suggestions
    if traits.get('micronutrient'):
        recommendations.append({
            "type": "micronutrient",
            "product": traits['micronutrient'],
            "quantity": "25 kg/hectare",
            "reason": f"{traits['notes']}",
            "priority": "low"
        })

    if traits.get('organic') and organic_matter < 3.0:
        recommendations.append({
            "type": "organic",
            "product": "Compost or Vermicompost",
            "quantity": "2-5 tons/hectare",
            "reason": f"{traits.get('notes', 'Improve soil structure and CEC')}",
            "priority": "medium"
        })

    # If no specific recommendations, provide balanced fertilizer
    if not recommendations:
        recommendations.append({
            "type": "balanced",
            "product": traits.get('prefer_balanced', "NPK (10-10-10)"),
            "quantity": "200-300 kg/hectare",
            "reason": "Soil nutrients are adequate. Apply balanced fertilizer for maintenance",
            "priority": "low"
        })
    
    return recommendations

# -------------------- New Utilities --------------------
def translate_text(text: str, target_lang: str = "en") -> str:
    """Translate text to target language using deep_translator if available; fallback to original text."""
    try:
        from deep_translator import GoogleTranslator
        if not text:
            return text
        if target_lang and target_lang != "en":
            return GoogleTranslator(source="auto", target=target_lang).translate(text)
        return text
    except Exception:
        # If translation fails or package missing, return original
        return text

def openweather_get(lat: float, lon: float):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"success": False, "warning": "OPENWEATHER_API_KEY not set", "current": {}, "daily": []}
    try:
        url = "https://api.openweathermap.org/data/2.5/onecall"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
            "exclude": "minutely"
        }
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e), "current": {}, "daily": []}

def geocode_openweather(query: str, state: str = None, country: str = "IN", limit: int = 1):
    """Resolve place name to coordinates using OpenWeather Geocoding API."""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return None
    try:
        # Build q string like "Pune,Maharashtra,IN"
        parts = [p for p in [query, state, country] if p]
        q = ",".join(parts)
        url = "http://api.openweathermap.org/geo/1.0/direct"
        params = {"q": q, "limit": limit, "appid": api_key}
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list) and data:
            item = data[0]
            return {
                "name": item.get("name"),
                "state": item.get("state"),
                "country": item.get("country"),
                "lat": item.get("lat"),
                "lon": item.get("lon")
            }
        return None
    except Exception:
        return None

def generate_weather_insights(ow):
    insights = []
    alerts = []
    try:
        daily = ow.get("daily", [])[:3]
        current = ow.get("current", {})
        # Temperature alerts
        for d in daily:
            dt = d.get("dt")
            tmax = d.get("temp", {}).get("max")
            tmin = d.get("temp", {}).get("min")
            pop = d.get("pop", 0)
            if tmax is not None and tmax >= 38:
                alerts.append({"type": "heat", "message": f"High temperature expected: {tmax}°C"})
            if tmin is not None and tmin <= 10:
                alerts.append({"type": "cold", "message": f"Low temperature expected: {tmin}°C"})
            if pop and pop >= 0.5:
                alerts.append({"type": "rain", "message": "High chance of rain; plan irrigation and fertilizer accordingly"})

        if current:
            humidity = current.get("humidity")
            wind = current.get("wind_speed")
            if humidity and humidity >= 85:
                insights.append("High humidity may increase fungal disease risk. Monitor leaves and ensure airflow.")
            if wind and wind >= 10:
                insights.append("High winds expected. Secure structures and avoid foliar sprays.")
    except Exception:
        pass

    return alerts, insights

def avg_soil_for_location(query: str):
    """Find average soil metrics for a location/district/state query; fallback to neutral values."""
    try:
        if soil_data is None or not isinstance(soil_data, pd.DataFrame) or soil_data.empty:
            return {
                "soil_ph": 6.8, "nitrogen": 90, "phosphorus": 50, "potassium": 70,
                "organic_matter": 2.5, "moisture": 55, "temperature": 26, "soil_type": "loam"
            }
        df = soil_data.copy()
        q = (query or "").strip().lower()
        if q:
            mask = (
                df['location'].astype(str).str.lower().str.contains(q) |
                df['district'].astype(str).str.lower().str.contains(q) |
                df['state'].astype(str).str.lower().str.contains(q) |
                df['soil_type'].astype(str).str.lower().str.contains(q)
            )
            df = df[mask]
        if df.empty:
            df = soil_data
        vals = {
            "soil_ph": float(df['ph'].dropna().mean()) if 'ph' in df else 6.8,
            "nitrogen": float(df['nitrogen'].dropna().mean()) if 'nitrogen' in df else 90,
            "phosphorus": float(df['phosphorus'].dropna().mean()) if 'phosphorus' in df else 50,
            "potassium": float(df['potassium'].dropna().mean()) if 'potassium' in df else 70,
            "organic_matter": float(df['organic_matter'].dropna().mean()) if 'organic_matter' in df else 2.5,
            "moisture": float(df['moisture'].dropna().mean()) if 'moisture' in df else 55,
            "temperature": float(df['temperature'].dropna().mean()) if 'temperature' in df else 26,
            "soil_type": str(df['soil_type'].mode().iloc[0]).lower() if 'soil_type' in df and not df['soil_type'].mode().empty else "loam"
        }
        return vals
    except Exception:
        return {
            "soil_ph": 6.8, "nitrogen": 90, "phosphorus": 50, "potassium": 70,
            "organic_matter": 2.5, "moisture": 55, "temperature": 26, "soil_type": "loam"
        }

def simple_leaf_diagnosis(image: Image.Image):
    """Very lightweight heuristic-based pest/disease signal from leaf image."""
    try:
        img = image.convert('RGB').resize((256, 256))
        arr = np.array(img)
        mean_rgb = arr.reshape(-1, 3).mean(axis=0)
        r, g, b = mean_rgb
        brownish = r > 120 and g < 110 and b < 110
        pale = g < 90 and r < 90
        if brownish:
            return {"label": "suspected_leaf_rust", "confidence": 0.62, "advice": "Remove affected leaves, apply fungicide (mancozeb) if spreading."}
        if pale:
            return {"label": "possible_n_deficiency", "confidence": 0.58, "advice": "Consider split N application and soil test confirmation."}
        return {"label": "healthy_or_uncertain", "confidence": 0.51, "advice": "Monitor regularly; upload clearer close-up for better detection."}
    except Exception as e:
        return {"label": "error", "confidence": 0.0, "advice": str(e)}

@app.route('/api/crops', methods=['GET'])
def get_crops():
    crops = [
        {"name": "Rice", "value": "rice", "season": "Kharif", "duration": "120-150 days"},
        {"name": "Wheat", "value": "wheat", "season": "Rabi", "duration": "120-140 days"},
        {"name": "Corn", "value": "corn", "season": "Kharif", "duration": "90-120 days"},
        {"name": "Soybean", "value": "soybean", "season": "Kharif", "duration": "90-120 days"},
        {"name": "Cotton", "value": "cotton", "season": "Kharif", "duration": "180-200 days"},
        {"name": "Tomato", "value": "tomato", "season": "All seasons", "duration": "90-120 days"},
        {"name": "Potato", "value": "potato", "season": "Rabi", "duration": "90-120 days"},
        {"name": "Sugarcane", "value": "sugarcane", "season": "Annual", "duration": "365 days"}
    ]
    return jsonify({"crops": crops})

@app.route('/api/soils', methods=['GET'])
def search_soils():
    """Search soils by query q across location, district, state, soil_type."""
    try:
        if soil_data is None:
            return jsonify({"success": False, "error": "Soil dataset not loaded"}), 500

        q = request.args.get('q', '').strip().lower()
        limit = int(request.args.get('limit', 10))

        df = soil_data.copy()
        if q:
            mask = (
                df['location'].astype(str).str.lower().str.contains(q) |
                df['district'].astype(str).str.lower().str.contains(q) |
                df['state'].astype(str).str.lower().str.contains(q) |
                df['soil_type'].astype(str).str.lower().str.contains(q)
            )
            df = df[mask]

        # Prepare compact results
        results = []
        for _, row in df.head(limit).iterrows():
            results.append({
                "soil_id": int(row.get('soil_id', 0)) if not pd.isna(row.get('soil_id', 0)) else None,
                "label": f"{row.get('location', '')}, {row.get('district', '')}, {row.get('state', '')} — {row.get('soil_type', '')}",
                "location": row.get('location', ''),
                "district": row.get('district', ''),
                "state": row.get('state', ''),
                "soil_type": row.get('soil_type', ''),
                "ph": float(row.get('ph', 0)) if not pd.isna(row.get('ph', 0)) else None,
                "nitrogen": float(row.get('nitrogen', 0)) if not pd.isna(row.get('nitrogen', 0)) else None,
                "phosphorus": float(row.get('phosphorus', 0)) if not pd.isna(row.get('phosphorus', 0)) else None,
                "potassium": float(row.get('potassium', 0)) if not pd.isna(row.get('potassium', 0)) else None,
                "organic_matter": float(row.get('organic_matter', 0)) if not pd.isna(row.get('organic_matter', 0)) else None,
                "moisture": float(row.get('moisture', 0)) if not pd.isna(row.get('moisture', 0)) else None,
                "temperature": float(row.get('temperature', 0)) if not pd.isna(row.get('temperature', 0)) else None,
                "season": row.get('season', '')
            })

        return jsonify({"success": True, "count": len(results), "results": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/locations/states', methods=['GET'])
def list_states():
    try:
        if soil_data is None or not isinstance(soil_data, pd.DataFrame) or soil_data.empty:
            return jsonify({"success": True, "states": []})
        states = (
            soil_data['state']
            .dropna()
            .astype(str)
            .str.strip()
            .replace('', np.nan)
            .dropna()
            .unique()
        )
        states_sorted = sorted(states, key=lambda x: x.lower())
        return jsonify({"success": True, "states": states_sorted})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/locations/districts', methods=['GET'])
def list_districts():
    try:
        state = request.args.get('state', '').strip()
        if soil_data is None or not isinstance(soil_data, pd.DataFrame) or soil_data.empty:
            return jsonify({"success": True, "districts": []})
        df = soil_data.copy()
        if state:
            df = df[df['state'].astype(str).str.strip().str.lower() == state.lower()]
        districts = (
            df['district']
            .dropna()
            .astype(str)
            .str.strip()
            .replace('', np.nan)
            .dropna()
            .unique()
        )
        districts_sorted = sorted(districts, key=lambda x: x.lower())
        return jsonify({"success": True, "districts": districts_sorted})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/fertilizers', methods=['GET'])
def get_fertilizers():
    fertilizers = [
        {"name": "Urea", "composition": "46-0-0", "type": "Nitrogen", "price_per_kg": 6.5},
        {"name": "DAP", "composition": "18-46-0", "type": "Phosphorus", "price_per_kg": 27.0},
        {"name": "MOP", "composition": "0-0-60", "type": "Potassium", "price_per_kg": 17.5},
        {"name": "NPK", "composition": "10-26-26", "type": "Complex", "price_per_kg": 24.0},
        {"name": "SSP", "composition": "0-16-0", "type": "Phosphorus", "price_per_kg": 8.5},
        {"name": "Zinc Sulfate", "composition": "Zn-21%", "type": "Micronutrient", "price_per_kg": 65.0},
        {"name": "Iron Chelate", "composition": "Fe-12%", "type": "Micronutrient", "price_per_kg": 120.0}
    ]
    return jsonify({"fertilizers": fertilizers})

@app.route('/api/soil-analysis', methods=['POST'])
def analyze_soil():
    try:
        data = request.get_json()
        
        soil_ph = float(data.get('soil_ph', 7.0))
        nitrogen = float(data.get('nitrogen', 0))
        phosphorus = float(data.get('phosphorus', 0))
        potassium = float(data.get('potassium', 0))
        organic_matter = float(data.get('organic_matter', 2.5))
        
        analysis = {
            "ph_status": get_ph_status(soil_ph),
            "nitrogen_status": get_nutrient_status(nitrogen, "nitrogen"),
            "phosphorus_status": get_nutrient_status(phosphorus, "phosphorus"),
            "potassium_status": get_nutrient_status(potassium, "potassium"),
            "organic_matter_status": get_organic_matter_status(organic_matter),
            "overall_rating": calculate_soil_rating(soil_ph, nitrogen, phosphorus, potassium, organic_matter)
        }
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

def get_ph_status(ph):
    if ph < 5.5:
        return {"level": "Very Acidic", "color": "red", "recommendation": "Add lime to increase pH"}
    elif ph < 6.0:
        return {"level": "Acidic", "color": "orange", "recommendation": "Consider adding lime"}
    elif ph < 7.5:
        return {"level": "Optimal", "color": "green", "recommendation": "pH is in good range"}
    elif ph < 8.0:
        return {"level": "Slightly Alkaline", "color": "orange", "recommendation": "Monitor pH levels"}
    else:
        return {"level": "Very Alkaline", "color": "red", "recommendation": "Add sulfur to decrease pH"}

def get_nutrient_status(value, nutrient):
    thresholds = {
        "nitrogen": {"low": 50, "medium": 100, "high": 150},
        "phosphorus": {"low": 30, "medium": 60, "high": 90},
        "potassium": {"low": 40, "medium": 80, "high": 120}
    }
    
    thresh = thresholds[nutrient]
    
    if value < thresh["low"]:
        return {"level": "Low", "color": "red", "recommendation": f"Apply {nutrient} fertilizer"}
    elif value < thresh["medium"]:
        return {"level": "Medium", "color": "orange", "recommendation": f"Moderate {nutrient} application needed"}
    elif value < thresh["high"]:
        return {"level": "Good", "color": "green", "recommendation": f"{nutrient} levels are adequate"}
    else:
        return {"level": "High", "color": "blue", "recommendation": f"{nutrient} levels are sufficient"}

def get_organic_matter_status(om):
    if om < 1.0:
        return {"level": "Very Low", "color": "red", "recommendation": "Add compost or manure"}
    elif om < 2.0:
        return {"level": "Low", "color": "orange", "recommendation": "Increase organic matter"}
    elif om < 4.0:
        return {"level": "Good", "color": "green", "recommendation": "Organic matter is adequate"}
    else:
        return {"level": "High", "color": "blue", "recommendation": "Excellent organic matter content"}

def calculate_soil_rating(ph, n, p, k, om):
    score = 0
    
    # pH score (0-25 points)
    if 6.0 <= ph <= 7.5:
        score += 25
    elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
        score += 15
    else:
        score += 5
    
    # Nutrient scores (0-25 points each)
    nutrients = [n, p, k]
    thresholds = [100, 60, 80]  # Good levels for N, P, K
    
    for nutrient, threshold in zip(nutrients, thresholds):
        if nutrient >= threshold:
            score += 25
        elif nutrient >= threshold * 0.7:
            score += 15
        elif nutrient >= threshold * 0.4:
            score += 10
        else:
            score += 5
    
    # Organic matter score (0-25 points)
    if om >= 3.0:
        score += 25
    elif om >= 2.0:
        score += 15
    elif om >= 1.0:
        score += 10
    else:
        score += 5
    
    rating = "Poor"
    if score >= 90:
        rating = "Excellent"
    elif score >= 75:
        rating = "Good"
    elif score >= 60:
        rating = "Fair"
    
    return {"score": score, "rating": rating, "max_score": 100}

@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = {
        "total_crops_supported": 8,
        "total_fertilizers": 7,
        "recommendation_accuracy": "92%",
        "avg_yield_improvement": "15-25%",
        "farmers_helped": 1250,
        "last_updated": datetime.now().isoformat()
    }
    return jsonify(stats)

# -------------------- New Endpoints --------------------
@app.route('/api/advisory', methods=['POST'])
def advisory():
    """Multilingual, location-specific crop advisory combining soil + weather + fertilizer guidance."""
    try:
        data = request.get_json(force=True)
        crop = data.get('crop_type', 'rice')
        location_query = data.get('location_query', '')  # e.g., district/state name
        lat = data.get('lat')
        lon = data.get('lon')
        target_lang = data.get('language', 'en')
        # Optional separated fields for better geocoding
        district = data.get('district')
        state = data.get('state')

        # Soil snapshot for location
        soil_snapshot = avg_soil_for_location(location_query)

        # Weather (geocode if needed)
        ow = {}
        weather_note = None
        resolved_loc = None
        if (lat is None or lon is None) and (location_query or state or district):
            # Try geocoding from provided human-readable location
            q = location_query or district or ""
            resolved_loc = geocode_openweather(q, state=state or None)
            if resolved_loc and resolved_loc.get('lat') is not None and resolved_loc.get('lon') is not None:
                lat = resolved_loc['lat']
                lon = resolved_loc['lon']
        if lat is not None and lon is not None:
            ow = openweather_get(float(lat), float(lon))
            if not ow or ow.get('success') is False:
                weather_note = ow.get('warning') or ow.get('error') or 'Weather data unavailable.'

        # Fertilizer recommendations
        recs = get_fertilizer_recommendations(
            crop_type=crop,
            soil_ph=soil_snapshot['soil_ph'],
            nitrogen=soil_snapshot['nitrogen'],
            phosphorus=soil_snapshot['phosphorus'],
            potassium=soil_snapshot['potassium'],
            organic_matter=soil_snapshot['organic_matter'],
            moisture=soil_snapshot['moisture'],
            temperature=soil_snapshot['temperature'],
            soil_type=soil_snapshot.get('soil_type', 'loam'),
            soil_name=location_query
        )

        alerts, insights = generate_weather_insights(ow if isinstance(ow, dict) else {})

        # Assemble advisory text (English)
        lines = []
        lines.append(f"Crop: {crop.capitalize()}")
        # Location lines
        if location_query:
            lines.append(f"Location: {location_query}")
        if resolved_loc:
            pretty = ", ".join([str(x) for x in [resolved_loc.get('name'), resolved_loc.get('state'), resolved_loc.get('country')] if x])
            if pretty:
                lines.append(f"Resolved: {pretty}")
        if lat is not None and lon is not None:
            lines.append(f"Coordinates: {lat}, {lon}")
        lines.append("Soil snapshot: "
                     f"pH {soil_snapshot['soil_ph']:.1f}, N {soil_snapshot['nitrogen']:.0f}, "
                     f"P {soil_snapshot['phosphorus']:.0f}, K {soil_snapshot['potassium']:.0f}, "
                     f"OM {soil_snapshot['organic_matter']:.1f}%")
        if insights:
            lines.append("Weather insights: " + "; ".join(insights))
        if alerts:
            lines.append("Alerts: " + "; ".join([a['message'] for a in alerts]))
        if weather_note:
            lines.append(f"Note: {weather_note}")
        lines.append("Fertilizer guidance:")
        for r in recs:
            lines.append(f"- [{r['priority']}] {r['type']}: {r['product']} — {r['quantity']} ({r['reason']})")
        advisory_en = "\n".join(lines)

        advisory_out = translate_text(advisory_en, target_lang)

        return jsonify({
            "success": True,
            "advisory": advisory_out,
            "advisory_en": advisory_en,
            "language": target_lang,
            "soil": soil_snapshot,
            "weather_available": bool(ow),
            "resolved_location": resolved_loc,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/weather-alerts', methods=['GET'])
def weather_alerts():
    try:
        lat_param = request.args.get('lat')
        lon_param = request.args.get('lon')
        q = request.args.get('q')
        state = request.args.get('state')
        district = request.args.get('district')

        resolved_loc = None
        if lat_param and lon_param:
            lat = float(lat_param)
            lon = float(lon_param)
        else:
            # Try to resolve by name
            query = q or district or ''
            if not (query or state):
                return jsonify({"success": False, "error": "Provide lat/lon or q/state/district"}), 400
            resolved_loc = geocode_openweather(query, state=state or None)
            if not resolved_loc or resolved_loc.get('lat') is None or resolved_loc.get('lon') is None:
                return jsonify({"success": False, "error": "Failed to resolve location name"}), 400
            lat = float(resolved_loc['lat'])
            lon = float(resolved_loc['lon'])
        ow = openweather_get(lat, lon)
        alerts, insights = generate_weather_insights(ow if isinstance(ow, dict) else {})
        return jsonify({
            "success": True,
            "alerts": alerts,
            "insights": insights,
            "warning": ow.get('warning') if isinstance(ow, dict) else None,
            "resolved_location": resolved_loc
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/pest-detect', methods=['POST'])
def pest_detect():
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image file found (field 'image')"}), 400
        file = request.files['image']
        img = Image.open(file.stream)
        result = simple_leaf_diagnosis(img)
        return jsonify({"success": True, "prediction": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/market-prices', methods=['GET'])
def market_prices():
    """Return market price tracking for a crop and state (mock + hook for integration)."""
    try:
        crop = (request.args.get('crop') or 'wheat').lower()
        state = (request.args.get('state') or 'Maharashtra').strip()

        # Base prices per crop (INR/qtl)
        crop_base = {
            'wheat': {"min": 1900, "avg": 2050, "max": 2400},
            'rice': {"min": 2000, "avg": 2300, "max": 2700},
            'soybean': {"min": 3700, "avg": 4200, "max": 4700},
            'tomato': {"min": 700, "avg": 1100, "max": 1800},
            'corn': {"min": 1600, "avg": 1850, "max": 2200}
        }
        unit = "INR/qtl"

        # Explicit overrides for some (crop,state) combos
        overrides = {
            ('wheat', 'Punjab'): {"min": 2000, "avg": 2150, "max": 2450},
            ('wheat', 'Madhya Pradesh'): {"min": 1950, "avg": 2100, "max": 2400},
            ('rice', 'West Bengal'): {"min": 2100, "avg": 2350, "max": 2750},
            ('rice', 'Tamil Nadu'): {"min": 2050, "avg": 2320, "max": 2720},
            ('soybean', 'Maharashtra'): {"min": 3850, "avg": 4300, "max": 4800},
            ('soybean', 'Madhya Pradesh'): {"min": 3800, "avg": 4250, "max": 4750},
            ('tomato', 'Karnataka'): {"min": 900, "avg": 1300, "max": 1900},
            ('corn', 'Bihar'): {"min": 1650, "avg": 1900, "max": 2250},
        }

        key = (crop, state)
        if crop in crop_base:
            base = crop_base[crop].copy()
        else:
            base = {"min": 1000, "avg": 1500, "max": 2000}

        if key in overrides:
            prices = overrides[key]
        else:
            # Deterministic state-based variation: compute a small delta from state hash
            try:
                h = sum(ord(c) for c in state) % 21  # 0..20
                # Variation within +/- 5% based on h
                factor = 0.95 + (h / 20.0) * 0.10  # 0.95..1.05
                prices = {
                    "min": int(base["min"] * factor),
                    "avg": int(base["avg"] * factor),
                    "max": int(base["max"] * factor),
                }
            except Exception:
                prices = base

        entry = {**prices, "unit": unit, "crop": crop, "state": state, "source": "mock", "note": "State-wise variation applied. Integrate Agmarknet for live data."}
        return jsonify({"success": True, "prices": entry})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/market-prices/history', methods=['GET'])
def market_prices_history():
    """Return historical market price trends for a crop and state for the last `days` (default 30)."""
    try:
        crop = (request.args.get('crop') or 'wheat').lower()
        state = (request.args.get('state') or 'Maharashtra').strip()
        district = (request.args.get('district') or '').strip()
        days = int(request.args.get('days', 30))
        days = max(7, min(days, 120))

        # Base prices per crop (INR/qtl) - reuse same base as current prices
        crop_base = {
            'wheat': {"min": 1900, "avg": 2050, "max": 2400},
            'rice': {"min": 2000, "avg": 2300, "max": 2700},
            'soybean': {"min": 3700, "avg": 4200, "max": 4700},
            'tomato': {"min": 700, "avg": 1100, "max": 1800},
            'corn': {"min": 1600, "avg": 1850, "max": 2200}
        }

        base = crop_base.get(crop, {"min": 1000, "avg": 1500, "max": 2000}).copy()

        # Deterministic state/district factor
        h_state = sum(ord(c) for c in state) % 21
        state_factor = 0.95 + (h_state / 20.0) * 0.10  # 0.95..1.05
        if district:
            h_dist = (sum(ord(c) for c in district) % 11)  # 0..10
            dist_factor = 0.98 + (h_dist / 10.0) * 0.04   # 0.98..1.02
        else:
            dist_factor = 1.0

        series = []
        today = datetime.utcnow().date()

        for i in range(days, 0, -1):
            d = today.fromordinal(today.toordinal() - i)
            # Deterministic daily wobble based on date and crop
            wobble_seed = (hash((d.toordinal(), crop)) % 11) - 5  # -5..+5
            wobble_pct = 1.0 + (wobble_seed / 100.0) * 0.6  # +/-3%

            mn = int(base['min'] * state_factor * dist_factor * wobble_pct)
            av = int(base['avg'] * state_factor * dist_factor * wobble_pct)
            mx = int(base['max'] * state_factor * dist_factor * wobble_pct)

            # Ensure ordering min <= avg <= max
            av = max(mn, min(av, mx))
            series.append({
                "date": d.isoformat(),
                "min": mn,
                "avg": av,
                "max": mx
            })

        return jsonify({
            "success": True,
            "unit": "INR/qtl",
            "crop": crop,
            "state": state,
            "district": district or None,
            "days": days,
            "series": series
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/translate', methods=['POST'])
def api_translate():
    try:
        data = request.get_json(force=True)
        text = data.get('text', '')
        lang = data.get('language', 'en')
        out = translate_text(text, lang)
        return jsonify({"success": True, "translated": out, "language": lang})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/tts', methods=['POST'])
def tts():
    """Text-to-speech: returns base64-encoded MP3 audio for given text and language."""
    try:
        data = request.get_json(force=True)
        text = data.get('text')
        lang = data.get('language', 'en')
        if not text:
            return jsonify({"success": False, "error": "text is required"}), 400
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang=lang)
            buf = BytesIO()
            tts.write_to_fp(buf)
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode('utf-8')
            return jsonify({"success": True, "audio_base64": b64, "format": "mp3"})
        except Exception as e:
            return jsonify({"success": False, "error": f"TTS failed: {e}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json(force=True)
        record = {
            "timestamp": datetime.now().isoformat(),
            "payload": data,
            "client_ip": request.remote_addr
        }
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        out_path = os.path.join(backend_dir, 'feedback.jsonl')
        with open(out_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

# Chat functionality placeholder
from flask import Response, jsonify

# Chat endpoint placeholder
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
        
    def generate():
        try:
            data = request.get_json()
            if not data:
                yield 'data: ' + json.dumps({
                    'success': False,
                    'error': 'No data received in request.'
                }) + '\n\n'
                return
                
            user_message = data.get('message', '').strip()
            
            if not user_message:
                yield 'data: ' + json.dumps({
                    'success': False,
                    'error': 'Message cannot be empty.'
                }) + '\n\n'
                return
            
            # Simple response without AI
            response_text = "Chat functionality is currently not available as it requires OpenAI API integration. " \
                          "Please check back later or contact support for more information."
            
            # Stream the response to maintain compatibility with frontend
            yield f'data: {json.dumps({"chunk": response_text, "success": True})}\n\n'
            # Send completion signal
            yield 'data: ' + json.dumps({
                'success': True,
                'done': True,
                'full_response': response_text
            }) + '\n\n'
        except Exception as e:
            print(f"Error in chat endpoint: {str(e)}")
            yield 'data: ' + json.dumps({
                'success': False,
                'error': 'An error occurred while processing your request.',
                'details': str(e)
            }) + '\n\n'
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
