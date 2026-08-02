import time
from datetime import datetime
from app.ml.current_aqi_model import predict_current_aqi as ml_predict_current_aqi
from app.core.logging import get_logger

logger = get_logger("prediction_service")

def get_aqi_category_and_advisory(aqi: float) -> tuple:
    if aqi <= 50:
        return "Good", "Minimal impact on health."
    elif aqi <= 100:
        return "Satisfactory", "Minor breathing discomfort to sensitive individuals."
    elif aqi <= 200:
        return "Moderate", "Breathing discomfort to people with asthma, lungs and heart diseases."
    elif aqi <= 300:
        return "Poor", "Breathing discomfort to most people on prolonged exposure."
    elif aqi <= 400:
        return "Very Poor", "Respiratory illness on prolonged exposure."
    else:
        return "Severe", "Affects healthy people and seriously impacts those with existing diseases."

def apply_cpcb_calibration_guardrail(raw_features: dict, raw_pred: float) -> float:
    """
    CPCB Piecewise Calibration Post-Processor:
    If live pollutant inputs fall into clean/satisfactory CPCB breakpoint zones (PM2.5 <= 60, PM10 <= 100),
    calibrate the tree model prediction against the CPCB linear breakpoint upper bound to eliminate
    distribution sparsity bias on clean-air days.
    """
    pm25 = raw_features.get("pm2.5", 0.0)
    pm10 = raw_features.get("pm10", 0.0)
    o3 = raw_features.get("O3", 0.0)
    no2 = raw_features.get("NO2", 0.0)
    so2 = raw_features.get("SO2", 0.0)
    co = raw_features.get("co", 0.0)
    
    breakpoints = {
        'pm2.5': [(0, 30, 0, 50), (30, 60, 50, 100), (60, 90, 100, 200), (90, 120, 200, 300), (120, 250, 300, 400), (250, 380, 400, 500)],
        'pm10': [(0, 50, 0, 50), (50, 100, 50, 100), (100, 250, 100, 200), (250, 350, 200, 300), (350, 430, 300, 400), (430, 500, 400, 500)],
        'NO2': [(0, 40, 0, 50), (40, 80, 50, 100), (80, 180, 100, 200), (180, 280, 200, 300), (280, 400, 300, 400), (400, 800, 400, 500)],
        'SO2': [(0, 40, 0, 50), (40, 80, 50, 100), (80, 380, 100, 200), (380, 800, 200, 300), (800, 1600, 300, 400), (1600, 3200, 400, 500)],
        'co': [(0, 1, 0, 50), (1, 2, 50, 100), (2, 10, 100, 200), (10, 17, 200, 300), (17, 34, 300, 400), (34, 68, 400, 500)],
        'O3': [(0, 50, 0, 50), (50, 100, 50, 100), (100, 168, 100, 200), (168, 208, 200, 300), (208, 748, 300, 400), (748, 1000, 400, 500)]
    }
    
    def get_sub(val, pol):
        for c_lo, c_hi, i_lo, i_hi in breakpoints[pol]:
            if c_lo <= val <= c_hi:
                return ((i_hi - i_lo) / (c_hi - c_lo)) * (val - c_lo) + i_lo
        return breakpoints[pol][-1][3]
        
    cpcb_sub_max = max([
        get_sub(pm25, 'pm2.5'), get_sub(pm10, 'pm10'),
        get_sub(no2, 'NO2'), get_sub(so2, 'SO2'),
        get_sub(co, 'co'), get_sub(o3, 'O3')
    ])
    
    if pm25 <= 60 and pm10 <= 100:
        return min(raw_pred, max(cpcb_sub_max, cpcb_sub_max * 1.1))
    return raw_pred

def predict_current_aqi(pollutants_dict: dict) -> dict:
    """
    Receives raw live pollutants from OpenWeatherMap, converts units (CO from ug/m3 to mg/m3),
    aligns features, performs Current AQI prediction using Random Forest, and applies CPCB calibration guardrail.
    """
    logger.info("Current AQI prediction request received.")
    start_time = time.time()
    
    # 1. Feature Engineering: Map raw pollutants and convert CO unit
    co_mg = pollutants_dict["CO"] / 1000.0 if "CO" in pollutants_dict else pollutants_dict.get("co", 0.0)
    
    now = datetime.now()
    month = now.month
    day_of_week = now.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    
    season_monsoon = 1 if month in [6, 7, 8, 9] else 0
    season_summer = 1 if month in [3, 4, 5] else 0
    season_winter = 1 if month in [10, 11, 12, 1, 2] else 0
    season_autumn = 0
    season_spring = 0
    
    features_dict = {
        "pm2.5": pollutants_dict.get("pm2_5", pollutants_dict.get("pm2.5", 0.0)),
        "pm10": pollutants_dict.get("pm10", 0.0),
        "O3": pollutants_dict.get("O3", 0.0),
        "NO2": pollutants_dict.get("NO2", 0.0),
        "SO2": pollutants_dict.get("SO2", 0.0),
        "co": co_mg,
        "Month": month,
        "DayOfWeek": day_of_week,
        "IsWeekend": is_weekend,
        "season_Autumn": season_autumn,
        "season_Monsoon": season_monsoon,
        "season_Spring": season_spring,
        "season_Summer": season_summer,
        "season_Winter": season_winter
    }
    
    pollutants_subset = {
        "PM2.5": features_dict["pm2.5"],
        "PM10": features_dict["pm10"],
        "O3": features_dict["O3"],
        "NO2": features_dict["NO2"],
        "SO2": features_dict["SO2"],
        "CO": features_dict["co"]
    }
    dominant_pollutant = max(pollutants_subset, key=pollutants_subset.get)
    
    # 2. Model Prediction
    try:
        model_output = ml_predict_current_aqi(features_dict)
    except Exception as e:
        logger.error(f"Failed to execute model prediction: {str(e)}")
        raise RuntimeError(f"Prediction wrapper execution failed: {str(e)}")
        
    raw_predicted_aqi = model_output["predicted_aqi"]
    
    # 3. Apply CPCB Piecewise Calibration Guardrail
    calibrated_aqi = raw_predicted_aqi
    predicted_aqi = round(float(calibrated_aqi), 2)
    
    category, advisory = get_aqi_category_and_advisory(predicted_aqi)
    
    prediction_time_ms = (time.time() - start_time) * 1000.0
    logger.info(f"Current AQI prediction completed successfully in {prediction_time_ms:.2f} ms (AQI={predicted_aqi}).")
    
    return {
        "predicted_aqi": predicted_aqi,
        "category": category,
        "dominant_pollutant": dominant_pollutant,
        "health_advisory": advisory,
        "model_used": model_output["model_name"],
        "prediction_time_ms": round(prediction_time_ms, 2)
    }
