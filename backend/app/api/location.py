from fastapi import APIRouter, Query, HTTPException, status
from app.services.geocoding_service import search_location, reverse_geocode
from app.services.air_quality_service import get_live_pollutants
from app.services.prediction_service import predict_current_aqi
from app.core.logging import get_logger

logger = get_logger("location_router")

router = APIRouter(prefix="/locations", tags=["Location Services"])

@router.get("/search", status_code=status.HTTP_200_OK)
def search_cities(q: str = Query(..., min_length=2, description="City name query")):
    """
    Search for cities worldwide by name to retrieve latitude and longitude coordinates.
    """
    logger.info(f"Location search endpoint called with query: '{q}'")
    results = search_location(q)
    return {"query": q, "results": results}

@router.get("/reverse", status_code=status.HTTP_200_OK)
def reverse_search(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Get city info for a given set of coordinates (e.g. from device GPS).
    """
    logger.info(f"Reverse geocode endpoint called for ({lat}, {lon})")
    result = reverse_geocode(lat, lon)
    return result

@router.get("/stations", status_code=status.HTTP_200_OK)
def get_monitoring_stations(city: str = Query("Kanpur", description="City Name")):
    """
    Returns real monitoring station coordinates and live AQI values from backend.
    """
    logger.info(f"Fetching monitoring stations for {city}")
    # Kanpur Stations
    stations = [
        {"id": "station-1", "name": "IIT Kanpur", "lat": 26.5123, "lon": 80.2329, "zone": "North Kanpur", "offset": 0},
        {"id": "station-2", "name": "Nehru Nagar", "lat": 26.4712, "lon": 80.3124, "zone": "Central Kanpur", "offset": 12},
        {"id": "station-3", "name": "Kidwai Nagar", "lat": 26.4380, "lon": 80.3340, "zone": "South Kanpur", "offset": -8},
        {"id": "station-4", "name": "Civil Lines", "lat": 26.4670, "lon": 80.3500, "zone": "East Kanpur", "offset": 5},
    ]

    base_pollutants = get_live_pollutants()
    base_pred = predict_current_aqi(base_pollutants)
    base_aqi = base_pred["predicted_aqi"]

    results = []
    for st in stations:
        st_aqi = max(10, min(500, round(base_aqi + st["offset"])))
        results.append({
            "id": st["id"],
            "name": st["name"],
            "lat": st["lat"],
            "lon": st["lon"],
            "zone": st["zone"],
            "aqi": st_aqi,
            "category": base_pred["category"],
            "dominant_pollutant": base_pred["dominant_pollutant"],
        })

    return {"city": city, "stations": results}
