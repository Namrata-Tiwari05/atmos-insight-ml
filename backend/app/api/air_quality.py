from fastapi import APIRouter, Query, status
from app.services.air_quality_service import get_live_pollutants
from app.core.logging import get_logger

router = APIRouter(prefix="/pollution-test", tags=["Air Quality Integration"])
logger = get_logger("air_quality_router")

@router.get("/", status_code=status.HTTP_200_OK)
def test_live_pollutants(
    lat: float | None = Query(None, description="Latitude"),
    lon: float | None = Query(None, description="Longitude")
):
    """
    Test Endpoint: Fetches and returns live criteria pollutant concentrations for specified coordinates.
    """
    logger.info(f"Test route /pollution-test triggered with lat={lat}, lon={lon}.")
    if lat is not None and lon is not None:
        return get_live_pollutants(lat=lat, lon=lon)
    return get_live_pollutants()
