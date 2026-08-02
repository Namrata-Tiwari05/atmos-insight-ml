import time
from datetime import datetime, timedelta
import requests
import numpy as np
from fastapi import HTTPException, status
from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger("weather_service")

def get_live_weather(lat: float = settings.LATITUDE, lon: float = settings.LONGITUDE) -> dict:
    """
    Fetches current weather data from OpenWeatherMap for the specified coordinates
    and normalizes the response schema for downstream ML and frontend layers.
    """
    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"

    logger.info(f"Initiating OpenWeatherMap request for Coordinates: ({lat}, {lon})")
    start_time = time.time()

    try:
        response = requests.get(url, timeout=10)
        response_time = time.time() - start_time
        logger.info(f"API Response received in {response_time:.2f} seconds. Status Code: {response.status_code}")

        if response.status_code == 401:
            logger.error("Unauthorized: Invalid OpenWeatherMap API Key.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid weather service API key."
            )
        elif response.status_code == 429:
            logger.error("Rate Limit Exceeded on OpenWeatherMap.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Weather service rate limit exceeded."
            )
        elif response.status_code != 200:
            logger.error(f"External API Error: Status {response.status_code}. Response: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Weather service provider returned an error."
            )

        data = response.json()

        rain_data = data.get("rain", {})
        rainfall = rain_data.get("1h", 0.0) or rain_data.get("3h", 0.0) or 0.0

        main_cond = data.get("weather", [{}])[0].get("main", "Clear").lower()

        condition = "cloudy"
        if "rain" in main_cond or "drizzle" in main_cond:
            condition = "rainy"
        elif "fog" in main_cond or "mist" in main_cond or "haze" in main_cond:
            condition = "foggy"
        elif "thunder" in main_cond or "storm" in main_cond:
            condition = "stormy"
        elif "clear" in main_cond:
            condition = "sunny"

        sys_data = data.get("sys", {})
        sunrise_ts = sys_data.get("sunrise")
        sunset_ts = sys_data.get("sunset")

        sunrise_str = datetime.fromtimestamp(sunrise_ts).strftime("%H:%M") if sunrise_ts else "05:30"
        sunset_str = datetime.fromtimestamp(sunset_ts).strftime("%H:%M") if sunset_ts else "18:45"

        cloud_cover = int(data["clouds"]["all"])
        uv_est = round(max(1.0, 8.5 - (cloud_cover / 12.0)), 1)

        normalized = {
            "temperature": round(float(data["main"]["temp"]), 1),
            "feels_like": round(float(data["main"].get("feels_like", data["main"]["temp"])), 1),
            "humidity": int(data["main"]["humidity"]),
            "pressure": int(data["main"]["pressure"]),
            "wind_speed": round(float(data["wind"]["speed"]) * 3.6, 1), # convert m/s to km/h
            "wind_direction": int(data["wind"].get("deg", 0)),
            "cloud_cover": cloud_cover,
            "visibility": round(float(data.get("visibility", 10000)) / 1000.0, 1), # km
            "rainfall": round(float(rainfall), 1),
            "uv_index": uv_est,
            "condition": condition,
            "description": data.get("weather", [{}])[0].get("description", "Clear Sky").title(),
            "sunrise": sunrise_str,
            "sunset": sunset_str,
            "location_name": data.get("name", "Kanpur")
        }

        return normalized

    except Exception as e:
        logger.error(f"Failed to fetch live weather: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch live weather data: {str(e)}"
        )


def get_hourly_weather_forecast(lat: float = settings.LATITUDE, lon: float = settings.LONGITUDE) -> list[dict]:
    """
    Fetches the 5-day / 3-hour forecast from OpenWeatherMap, interpolates hourly
    meterological inputs for the next 24 hours (H+1 to H+24), and returns normalized
    hourly weather objects.
    """
    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"

    logger.info(f"Initiating OpenWeatherMap 5-day forecast request for ({lat}, {lon})...")

    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            raw_items = data.get("list", [])

            if len(raw_items) >= 8:
                # Extract timestamps and weather variables from 3-hour points
                timestamps = []
                temps = []
                humidities = []
                winds = []
                rains = []

                now_ts = int(time.time())
                for item in raw_items:
                    ts = item.get("dt", 0)
                    timestamps.append(ts)
                    temps.append(float(item["main"]["temp"]))
                    humidities.append(float(item["main"]["humidity"]))
                    winds.append(float(item["wind"]["speed"]) * 3.6) # m/s to km/h
                    r_val = item.get("rain", {}).get("3h", 0.0) or 0.0
                    rains.append(float(r_val) / 3.0) # mm/h

                # Generate 24 target timestamps (H+1 to H+24)
                target_timestamps = [now_ts + h * 3600 for h in range(1, 25)]

                # Linear interpolation across 24 hours
                interp_temps = np.interp(target_timestamps, timestamps, temps)
                interp_hums = np.interp(target_timestamps, timestamps, humidities)
                interp_winds = np.interp(target_timestamps, timestamps, winds)
                interp_rains = np.interp(target_timestamps, timestamps, rains)

                hourly_forecast = []
                for h in range(24):
                    t = round(float(interp_temps[h]), 1)
                    hum = round(float(interp_hums[h]), 1)
                    w_spd = round(float(interp_winds[h]), 1)
                    rain_h = round(float(interp_rains[h]), 2)

                    dew_p = round(t - ((100.0 - hum) / 5.0), 1)
                    app_t = round(t + 0.33 * (hum / 100.0) - 0.7 * w_spd - 4.0, 1)

                    hourly_forecast.append({
                        "hour_step": h + 1,
                        "temperature": t,
                        "humidity": hum,
                        "wind_speed": w_spd,
                        "precipitation": rain_h,
                        "dew_point": dew_p,
                        "apparent_temperature": app_t
                    })

                logger.info("SUCCESS: Interpolated 24-hour weather forecast from OpenWeatherMap.")
                return hourly_forecast

    except Exception as e:
        logger.warn(f"Failed to fetch forecast API: {e}. Falling back to baseline weather.")

    # Fallback: repeat current live weather if API fails
    base_live = get_live_weather(lat, lon)
    t = base_live["temperature"]
    hum = base_live["humidity"]
    w_spd = base_live["wind_speed"]
    rain_h = base_live["rainfall"]
    dew_p = round(t - ((100.0 - hum) / 5.0), 1)
    app_t = round(t + 0.33 * (hum / 100.0) - 0.7 * w_spd - 4.0, 1)

    return [
        {
            "hour_step": h + 1,
            "temperature": t,
            "humidity": hum,
            "wind_speed": w_spd,
            "precipitation": rain_h,
            "dew_point": dew_p,
            "apparent_temperature": app_t
        }
        for h in range(24)
    ]
