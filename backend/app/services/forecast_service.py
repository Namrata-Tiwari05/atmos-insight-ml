import time
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from app.config.settings import settings
from app.ml.model_loader import model_loader
from app.ml.forecast_model import forecast_next_hour as ml_forecast_next_hour
from app.services.prediction_service import predict_current_aqi
from app.services.weather_service import get_hourly_weather_forecast
from app.core.logging import get_logger

logger = get_logger("forecast_service")

class HistoryManager:
    """
    Manages historical hourly AQI values, providing helpers to compute lag,
    diff, and rolling features in real-time.
    """
    def __init__(self):
        self.aqi_history = []

    def initialize_history(self, current_aqi: float, lat: float | None = None, lon: float | None = None):
        """
        Initializes the past 24 hours of AQI values using live pollution history
        if available, falling back to a flat array of current AQI if the API fails.
        """
        logger.info("Initializing historical AQI series...")
        target_lat = lat if lat is not None else settings.LATITUDE
        target_lon = lon if lon is not None else settings.LONGITUDE
        api_key = settings.OPENWEATHER_API_KEY

        end_ts = int(time.time())
        start_ts = end_ts - 24 * 3600

        history_url = f"http://api.openweathermap.org/data/2.5/air_pollution/history?lat={target_lat}&lon={target_lon}&start={start_ts}&end={end_ts}&appid={api_key}"

        try:
            res = requests.get(history_url, timeout=5)
            if res.status_code == 200:
                list_data = res.json().get("list", [])
                if len(list_data) >= 24:
                    logger.info(f"Retrieved {len(list_data)} historical readings from API for ({target_lat}, {target_lon}).")
                    temp_history = []
                    for item in list_data[-24:]:
                        comps = item["components"]
                        pollutants = {
                            "PM2.5": comps.get("pm2_5", 0.0),
                            "PM10": comps.get("pm10", 0.0),
                            "O3": comps.get("o3", 0.0),
                            "NO2": comps.get("no2", 0.0),
                            "SO2": comps.get("so2", 0.0),
                            "CO": comps.get("co", 0.0)
                        }
                        res_aqi = predict_current_aqi(pollutants)["predicted_aqi"]
                        temp_history.append(res_aqi)
                    self.aqi_history = temp_history
                    logger.info("SUCCESS: History initialized from live OpenWeather history records.")
                    return
        except Exception as e:
            logger.warn(f"Failed to fetch live API history: {str(e)}. Using fallback initialization.")

        logger.info("Initializing fallback historical series with current AQI.")
        self.aqi_history = [current_aqi] * 24

    def update_history(self, next_aqi: float):
        """
        Appends the newly predicted AQI and shifts out the oldest.
        """
        self.aqi_history.append(next_aqi)
        if len(self.aqi_history) > 24:
            self.aqi_history.pop(0)

    def get_features(self) -> dict:
        """
        Calculates all lag, diff, and rolling stats from the current 24-hour history.
        """
        history = self.aqi_history
        series = pd.Series(history)

        features = {}

        # Lags
        features["aqi_lag_1"] = history[-1]
        features["aqi_lag_2"] = history[-2]
        features["aqi_lag_24"] = history[0]

        # Diff and Pct Change
        features["aqi_diff"] = history[-1] - history[-2]
        features["aqi_pct_change"] = (history[-1] - history[-2]) / (history[-2] + 1e-5)

        # Rolling windows: 3, 6, 12, 24
        for w in [3, 6, 12, 24]:
            win = series.iloc[-w:]
            features[f"aqi_roll_mean_{w}"] = win.mean()
            features[f"aqi_roll_std_{w}"] = win.std() if len(win) > 1 else 0.0
            features[f"aqi_roll_min_{w}"] = win.min()
            features[f"aqi_roll_max_{w}"] = win.max()

        for k in features:
            if pd.isna(features[k]):
                features[k] = 0.0

        return features

# Global instance of history manager
history_manager = HistoryManager()

def forecast_next_24_hours(current_aqi: float, live_weather: dict, lat: float | None = None, lon: float | None = None) -> dict:
    """
    Executes a 24-step recursive forecast using the XGBoost hourly model fed with
    dynamic 24-hour weather forecast inputs.
    """
    target_lat = lat if lat is not None else settings.LATITUDE
    target_lon = lon if lon is not None else settings.LONGITUDE

    logger.info(f"Starting 24-hour recursive forecasting for coordinates ({target_lat}, {target_lon})...")
    start_time = time.time()

    # Initialize history manager
    history_manager.initialize_history(current_aqi, lat=target_lat, lon=target_lon)

    # Fetch 24 hourly weather forecast items
    weather_forecast_24h = get_hourly_weather_forecast(lat=target_lat, lon=target_lon)

    forecast_results = []
    current_time = datetime.now()

    for h in range(1, 25):
        hour_time = current_time + timedelta(hours=h)
        hour_val = hour_time.hour
        month_val = hour_time.month

        # Step weather inputs from forecast API
        w_step = weather_forecast_24h[h - 1]
        temp = w_step["temperature"]
        humidity = w_step["humidity"]
        wind_speed = w_step["wind_speed"]
        rainfall = w_step["precipitation"]
        dew_point = w_step["dew_point"]
        apparent_temp = w_step["apparent_temperature"]

        # Build hourly features dictionary
        payload = {
            "temperature_2m (C)": temp,
            "relative_humidity_2m (%)": humidity,
            "dew_point_2m (C)": dew_point,
            "apparent_temperature (C)": apparent_temp,
            "precipitation (mm)": rainfall,
            "rain (mm)": rainfall,
            "snowfall (cm)": 0.0,
            "snow_depth (m)": 0.0,
            "wind_speed_10m (km/h)": wind_speed,
            "AQI": history_manager.aqi_history[-1],
            "Hour": hour_val,
            "DayOfWeek": hour_time.weekday(),
            "Month": month_val,
            "season_Autumn": 0,
            "season_Monsoon": 1 if month_val in [6, 7, 8, 9] else 0,
            "season_Spring": 0,
            "season_Summer": 1 if month_val in [3, 4, 5] else 0,
            "season_Winter": 1 if month_val in [10, 11, 12, 1, 2] else 0,
            "Hour_sin": np.sin(2 * np.pi * hour_val / 24.0),
            "Hour_cos": np.cos(2 * np.pi * hour_val / 24.0),
            "Month_sin": np.sin(2 * np.pi * month_val / 12.0),
            "Month_cos": np.cos(2 * np.pi * month_val / 12.0)
        }

        # Append history statistics
        hist_feats = history_manager.get_features()
        payload.update(hist_feats)

        req_features = model_loader.get_hourly_features()
        renamed_payload = {}
        for feat in req_features:
            if "temperature_2m" in feat:
                renamed_payload[feat] = payload["temperature_2m (C)"]
            elif "relative_humidity_2m" in feat:
                renamed_payload[feat] = payload["relative_humidity_2m (%)"]
            elif "dew_point_2m" in feat:
                renamed_payload[feat] = payload["dew_point_2m (C)"]
            elif "apparent_temperature" in feat:
                renamed_payload[feat] = payload["apparent_temperature (C)"]
            elif "wind_speed_10m" in feat:
                renamed_payload[feat] = payload["wind_speed_10m (km/h)"]
            else:
                renamed_payload[feat] = payload.get(feat, 0.0)

        # Predict single step
        raw_next_aqi = ml_forecast_next_hour(renamed_payload)

        # Apply official CPCB standard upper-bound guardrail [0, 500]
        clamped_aqi = min(500.0, max(0.0, float(raw_next_aqi)))

        # Append step results
        forecast_results.append({
            "step": h,
            "hour": hour_time.strftime("%H:00"),
            "timestamp": hour_time.strftime("%Y-%m-%d %H:00"),
            "predicted_aqi": round(clamped_aqi, 2),
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "precipitation": rainfall
        })

        # Update sliding history with newly predicted AQI
        history_manager.update_history(clamped_aqi)

    exec_time = time.time() - start_time
    logger.info(f"Recursive forecast finished successfully in {exec_time:.4f} seconds.")

    return {
        "current_aqi": round(current_aqi, 2),
        "forecast": forecast_results,
        "execution_time_seconds": round(exec_time, 4)
    }


def forecast_next_7_days(
    current_aqi: float,
    live_weather: dict | None = None,
    weather_data: dict | None = None,
    pollutant_data: dict | None = None,
    lat: float | None = None,
    lon: float | None = None
) -> dict:
    """
    Executes a 7-day daily forecast using the retrained 7-day XGBoost daily model.
    """
    logger.info("Starting 7-day daily forecasting...")
    start_time = time.time()

    daily_model = model_loader.get_daily_model()
    daily_scaler = model_loader.get_daily_scaler()
    daily_features = model_loader.get_daily_features()

    w_dict = weather_data if weather_data is not None else (live_weather if live_weather is not None else {})
    p_dict = pollutant_data if pollutant_data is not None else {}

    temp = w_dict.get("temperature", 25.0)
    humidity = w_dict.get("humidity", 60.0)
    pm25 = p_dict.get("PM25", p_dict.get("pm2_5", 10.0))
    pm10 = p_dict.get("PM10", p_dict.get("pm10", 15.0))

    daily_results = []
    start_date = datetime.now()

    running_aqi = current_aqi
    running_aqi_history = [current_aqi] * 7

    for d in range(1, 8):
        day_date = start_date + timedelta(days=d)
        m_val = day_date.month

        s_series = pd.Series(running_aqi_history)
        mean_3 = s_series.iloc[-3:].mean()
        mean_7 = s_series.iloc[-7:].mean()
        std_7 = s_series.iloc[-7:].std() if len(s_series) > 1 else 0.0

        payload = {
            "AQI_lag1": running_aqi,
            "AQI_lag2": running_aqi_history[-2] if len(running_aqi_history) >= 2 else running_aqi,
            "AQI_lag3": running_aqi_history[-3] if len(running_aqi_history) >= 3 else running_aqi,
            "AQI_lag7": running_aqi_history[0],
            "AQI_roll_mean_3": mean_3,
            "AQI_roll_mean_7": mean_7,
            "AQI_roll_std_7": std_7,
            "pm2.5_lag1": pm25,
            "pm10_lag1": pm10,
            "Month": m_val,
            "DayOfWeek": day_date.weekday(),
            "DayOfYear": day_date.timetuple().tm_yday,
            "season_Autumn": 0,
            "season_Monsoon": 1 if m_val in [6, 7, 8, 9] else 0,
            "season_Spring": 0,
            "season_Summer": 1 if m_val in [3, 4, 5] else 0,
            "season_Winter": 1 if m_val in [10, 11, 12, 1, 2] else 0,
        }

        # Build dataframe matching exact feature names required by scaler/model
        df_feat = pd.DataFrame([payload])
        for feat in daily_features:
            if feat not in df_feat.columns:
                df_feat[feat] = 0.0

        df_feat = df_feat[daily_features]

        df_scaled = pd.DataFrame(daily_scaler.transform(df_feat), columns=daily_features)
        pred_day_aqi = float(daily_model.predict(df_scaled)[0])

        clamped = min(500.0, max(0.0, pred_day_aqi))

        daily_results.append({
            "day_index": d,
            "date": day_date.strftime("%Y-%m-%d"),
            "day_name": day_date.strftime("%a"),
            "predicted_aqi": round(clamped, 2)
        })

        running_aqi = clamped
        running_aqi_history.append(clamped)
        if len(running_aqi_history) > 7:
            running_aqi_history.pop(0)

    exec_time = time.time() - start_time
    logger.info(f"7-day daily forecast completed in {exec_time:.4f} seconds.")

    return {
        "current_aqi": round(current_aqi, 2),
        "forecast": daily_results,
        "execution_time_seconds": round(exec_time, 4)
    }
