import time
import requests
from fastapi import HTTPException, status
from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger("geocoding_service")

def search_location(query: str, limit: int = 5) -> list[dict]:
    """
    Searches for global locations using OpenWeatherMap Direct Geocoding API.
    """
    if not query or not query.strip():
        return []
        
    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/geo/1.0/direct?q={query.strip()}&limit={limit}&appid={api_key}"
    
    logger.info(f"Initiating OpenWeatherMap Geocoding search for query: '{query}'")
    start_time = time.time()
    
    try:
        response = requests.get(url, timeout=10)
        response_time = time.time() - start_time
        logger.info(f"Geocoding API Response received in {response_time:.2f}s. Status Code: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Geocoding API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Geocoding service provider returned an error."
            )
            
        locations = response.json()
        results = []
        for loc in locations:
            name = loc.get("name", "")
            state = loc.get("state", "")
            country = loc.get("country", "")
            
            # Format display label (e.g. "Delhi, NCT, IN" or "London, GB")
            parts = [p for p in [name, state, country] if p]
            display_name = ", ".join(parts)
            
            results.append({
                "name": name,
                "state": state,
                "country": country,
                "display_name": display_name,
                "lat": float(loc["lat"]),
                "lon": float(loc["lon"])
            })
            
        return results

    except requests.exceptions.Timeout:
        logger.error("Geocoding API request timed out.")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Request to geocoding service timed out."
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error in geocoding service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Geocoding service is currently unreachable."
        )

def reverse_geocode(lat: float, lon: float) -> dict:
    """
    Performs reverse geocoding to retrieve city details for given coordinates.
    """
    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={api_key}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200 and response.json():
            loc = response.json()[0]
            name = loc.get("name", "")
            state = loc.get("state", "")
            country = loc.get("country", "")
            parts = [p for p in [name, state, country] if p]
            display_name = ", ".join(parts)
            return {
                "name": name,
                "state": state,
                "country": country,
                "display_name": display_name,
                "lat": lat,
                "lon": lon
            }
    except Exception as e:
        logger.warning(f"Reverse geocode failed for ({lat}, {lon}): {str(e)}")
        
    return {
        "name": f"Location ({lat:.2f}, {lon:.2f})",
        "state": "",
        "country": "",
        "display_name": f"Location ({lat:.2f}, {lon:.2f})",
        "lat": lat,
        "lon": lon
    }
