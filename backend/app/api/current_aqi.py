import time
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from app.services.weather_service import get_live_weather
from app.services.air_quality_service import get_live_pollutants
from app.services.prediction_service import predict_current_aqi, get_aqi_category_and_advisory
from app.services.geocoding_service import reverse_geocode
from app.core.logging import get_logger

logger = get_logger("current_aqi_router")

router = APIRouter(prefix="", tags=["Inference Engine"])

class PredictPayload(BaseModel):
    PM25: float = Field(..., alias="pm25", description="PM2.5 concentration in ug/m3")
    PM10: float = Field(..., alias="pm10", description="PM10 concentration in ug/m3")
    NO2: float = Field(..., alias="no2", description="NO2 concentration in ug/m3")
    SO2: float = Field(..., alias="so2", description="SO2 concentration in ug/m3")
    CO: float = Field(..., alias="co", description="CO concentration in mg/m3")
    O3: float = Field(..., alias="o3", description="O3 concentration in ug/m3")

    class Config:
        populate_by_name = True

@router.get("/current-aqi", status_code=status.HTTP_200_OK)
@router.get("/current-aqi/", status_code=status.HTTP_200_OK)
def get_current_aqi_endpoint(
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude"),
    city: str | None = Query(None, description="City Name")
):
    """
    Fetches live weather and pollutants for specified coordinates or city, runs the Current AQI model (Random Forest),
    and returns a normalized JSON object containing predicted AQI, category, and health advisories.
    """
    logger.info(f"Incoming GET request to /api/current-aqi (lat={lat}, lon={lon}, city={city})")
    start_time = time.time()
    
    try:
        if lat is not None and lon is not None:
            weather_data = get_live_weather(lat=lat, lon=lon)
            raw_pollutants = get_live_pollutants(lat=lat, lon=lon)
            location_name = city if city else reverse_geocode(lat, lon)["name"]
        else:
            weather_data = get_live_weather()
            raw_pollutants = get_live_pollutants()
            location_name = city if city else "Kanpur"
        
        # 1. Run Random Forest prediction service
        prediction = predict_current_aqi(raw_pollutants)
        
        # 2. Normalize pollutant units (CO converted from ug/m3 to mg/m3)
        raw_co = raw_pollutants.get("CO", raw_pollutants.get("co", 0.0))
        co_mg = round(raw_co / 1000.0, 2) if raw_co > 50 else round(raw_co, 2)
        
        normalized_pollutants = {
            "PM25": raw_pollutants.get("pm2_5", raw_pollutants.get("pm2.5", raw_pollutants.get("PM25", 0.0))),
            "PM10": raw_pollutants.get("pm10", raw_pollutants.get("PM10", 0.0)),
            "NO2": raw_pollutants.get("NO2", raw_pollutants.get("no2", 0.0)),
            "SO2": raw_pollutants.get("SO2", raw_pollutants.get("so2", 0.0)),
            "CO": co_mg,
            "O3": raw_pollutants.get("O3", raw_pollutants.get("o3", 0.0))
        }
        
        response = {
            "timestamp": datetime.now().isoformat(),
            "location": location_name,
            "current_aqi": prediction["predicted_aqi"],
            "category": prediction["category"],
            "dominant_pollutant": prediction["dominant_pollutant"],
            "health_advisory": {
                "general_recommendation": prediction["health_advisory"],
                "sensitive_groups": "Minor breathing discomfort to sensitive people",
                "mask_required": prediction["predicted_aqi"] > 200,
                "outdoor_activity": "Enjoy outdoor activities" if prediction["predicted_aqi"] <= 100 else "Limit prolonged outdoor exertion"
            },
            "model_used": prediction["model_used"],
            "weather": weather_data,
            "pollutants": normalized_pollutants,
            "latency_ms": round((time.time() - start_time) * 1000.0, 2)
        }
        
        logger.info(f"Successfully processed GET /current-aqi for {location_name} in {response['latency_ms']:.2f} ms.")
        return response
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Internal processing failure: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference execution encountered an unexpected server error."
        )

@router.post("/predict-aqi", status_code=status.HTTP_200_OK)
@router.post("/predict-aqi/", status_code=status.HTTP_200_OK)
def predict_aqi_from_pollutants(payload: PredictPayload):
    """
    POST endpoint to run Random Forest ML inference on user-submitted criteria pollutant concentrations.
    Standardized payload: PM25, PM10, NO2, SO2, O3 in ug/m3; CO in mg/m3.
    """
    logger.info(f"Incoming POST request for AQI prediction: {payload}")
    start_time = time.time()
    
    try:
        pollutants_dict = {
            "pm2.5": payload.PM25,
            "pm10": payload.PM10,
            "NO2": payload.NO2,
            "SO2": payload.SO2,
            "co": payload.CO, # mg/m3
            "CO": payload.CO * 1000.0, # ug/m3 for prediction_service conversion
            "O3": payload.O3,
        }
        
        prediction = predict_current_aqi(pollutants_dict)
        category, advisory = get_aqi_category_and_advisory(prediction["predicted_aqi"])
        
        return {
            "timestamp": datetime.now().isoformat(),
            "predicted_aqi": prediction["predicted_aqi"],
            "category": category,
            "dominant_pollutant": prediction["dominant_pollutant"],
            "health_advisory": {
                "general_recommendation": advisory,
                "sensitive_groups": "Minor breathing discomfort to sensitive people",
                "mask_required": prediction["predicted_aqi"] > 200,
                "outdoor_activity": "Enjoy outdoor activities" if prediction["predicted_aqi"] <= 100 else "Limit prolonged outdoor exertion"
            },
            "model_used": prediction["model_used"],
            "latency_ms": round((time.time() - start_time) * 1000.0, 2)
        }
        
    except Exception as e:
        logger.error(f"Prediction execution error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model Inference Error: {str(e)}"
        )
