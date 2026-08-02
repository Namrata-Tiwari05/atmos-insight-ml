from fastapi import APIRouter, Query, status
from app.services.weather_service import get_live_weather
from app.core.logging import get_logger

router = APIRouter(prefix="/weather-test", tags=["Weather Integration"])
logger = get_logger("weather_router")

@router.get("/", status_code=status.HTTP_200_OK)
def test_live_weather(
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude")
):
    """
    Test Endpoint: Fetches and returns live weather variables for specified coordinates (defaults to configured city).
    """
    logger.info(f"Route /weather-test triggered with lat={lat}, lon={lon}.")
    if lat is not None and lon is not None:
        return get_live_weather(lat=lat, lon=lon)
    return get_live_weather()
