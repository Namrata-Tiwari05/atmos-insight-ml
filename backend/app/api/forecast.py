import time
import joblib
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException, status
from app.services.weather_service import get_live_weather
from app.services.air_quality_service import get_live_pollutants
from app.services.prediction_service import predict_current_aqi, get_aqi_category_and_advisory
from app.services.forecast_service import forecast_next_24_hours, forecast_next_7_days
from app.services.geocoding_service import reverse_geocode
from app.ml.model_loader import model_loader
from app.core.logging import get_logger

logger = get_logger("forecast_router")

router = APIRouter(prefix="/forecast", tags=["Inference Engine"])

@router.get("/24-hour", status_code=status.HTTP_200_OK)
def get_24_hour_forecast(
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude"),
    city: str | None = Query(None, description="City Name")
):
    """
    Fetches live weather and pollutants for specified location, runs current model, and recursively forecasts
    AQI for the next 24 hours using the XGBoost model.
    """
    logger.info(f"Incoming GET request to /api/forecast/24-hour (lat={lat}, lon={lon}, city={city})")
    start_time = time.time()

    try:
        if lat is not None and lon is not None:
            weather_data = get_live_weather(lat=lat, lon=lon)
            pollution_data = get_live_pollutants(lat=lat, lon=lon)
            location_name = city if city else reverse_geocode(lat, lon)["name"]
        else:
            weather_data = get_live_weather()
            pollution_data = get_live_pollutants()
            location_name = city if city else "Kanpur"

        # 2. Get current AQI baseline
        current_pred = predict_current_aqi(pollution_data)
        current_aqi = current_pred["predicted_aqi"]

        # 3. Compute 24-hour forecast with location
        forecast_data = forecast_next_24_hours(current_aqi, weather_data, lat=lat, lon=lon)

        augmented_forecast = []
        for step in forecast_data["forecast"]:
            step_aqi = step["predicted_aqi"]
            category, _ = get_aqi_category_and_advisory(step_aqi)
            augmented_forecast.append({
                "hour": step["hour"],
                "timestamp": step["timestamp"],
                "predicted_aqi": step_aqi,
                "category": category
            })

        response = {
            "generated_at": datetime.now().isoformat(),
            "location": location_name,
            "current_aqi": round(current_aqi, 2),
            "forecast": augmented_forecast,
            "execution_time_seconds": forecast_data["execution_time_seconds"],
            "latency_ms": round((time.time() - start_time) * 1000.0, 2)
        }

        logger.info(f"Successfully processed GET /forecast/24-hour for {location_name} in {response['latency_ms']:.2f} ms.")
        return response

    except Exception as e:
        logger.error(f"Failed to generate 24-hour forecast: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting engine encountered an unexpected error: {str(e)}"
        )


@router.get("/7-day", status_code=status.HTTP_200_OK)
def get_7_day_forecast(
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude"),
    city: str | None = Query(None, description="City Name")
):
    """
    Exposes the retrained 7-day daily forecasting model with CPCB categories and validation metrics.
    """
    logger.info(f"Incoming GET request to /api/forecast/7-day (lat={lat}, lon={lon}, city={city})")
    start_time = time.time()

    try:
        weather_data = get_live_weather(lat=lat, lon=lon) if (lat is not None and lon is not None) else get_live_weather()
        pollution_data = get_live_pollutants(lat=lat, lon=lon) if (lat is not None and lon is not None) else get_live_pollutants()
        location_name = city if city else ("Kanpur" if lat is None else reverse_geocode(lat, lon)["name"])

        current_aqi_res = predict_current_aqi(pollution_data)
        curr_aqi = current_aqi_res.get("predicted_aqi", 100.0)

        forecast_res = forecast_next_7_days(curr_aqi, weather_data=weather_data, pollutant_data=pollution_data)

        augmented_forecast = []
        for step in forecast_res["forecast"]:
            step_aqi = step["predicted_aqi"]
            category, _ = get_aqi_category_and_advisory(step_aqi)
            augmented_forecast.append({
                "day_index": step["day_index"],
                "date": step["date"],
                "day_name": step["day_name"],
                "predicted_aqi": step_aqi,
                "category": category
            })

        response = {
            "generated_at": datetime.now().isoformat(),
            "location": location_name,
            "current_aqi": round(curr_aqi, 2),
            "forecast": augmented_forecast,
            "validation_metrics": {
                "r2_score": 0.4312,
                "mae": 30.79,
                "rmse": 40.78,
                "error_margin": "±40.8 AQI",
                "confidence": "Moderate"
            },
            "latency_ms": round((time.time() - start_time) * 1000.0, 2)
        }

        logger.info(f"Successfully processed GET /forecast/7-day for {location_name} in {response['latency_ms']:.2f} ms.")
        return response

    except Exception as e:
        logger.error(f"Failed to generate 7-day forecast: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Daily forecasting engine encountered an unexpected error: {str(e)}"
        )
