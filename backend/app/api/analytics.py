import os
import json
import time
import pandas as pd
from fastapi import APIRouter, status, HTTPException
from app.core.logging import get_logger
from app.services.air_quality_service import get_live_pollutants

router = APIRouter(prefix="/analytics", tags=["Analytics Integrated Engine"])
logger = get_logger("analytics_router")

_cached_correlation_matrix = None
_cached_seasonal_aqi = None
_cached_top_features = None

def _load_historical_analytics():
    global _cached_correlation_matrix, _cached_seasonal_aqi, _cached_top_features

    if (_cached_correlation_matrix is not None and
        _cached_seasonal_aqi is not None and
        _cached_top_features is not None):
        return _cached_correlation_matrix, _cached_seasonal_aqi, _cached_top_features

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    csv_path = os.path.join(project_root, "data", "processed", "nehru_nagar_with_aqi.csv")
    json_path = os.path.join(project_root, "backend", "app", "static", "shap", "top_features.json")

    if not os.path.exists(csv_path):
        logger.error(f"Processed dataset not found at path: {csv_path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Historical processed dataset is missing."
        )

    try:
        df = pd.read_csv(csv_path)
        df['Date'] = pd.to_datetime(df['Date'])
        df['Month_Num'] = df['Date'].dt.month

        # 1. Pearson Correlation Matrix
        cols_map = {
            'AQI': 'AQI',
            'pm2.5': 'PM2.5',
            'pm10': 'PM10',
            'NO2': 'NO2',
            'SO2': 'SO2',
            'co': 'CO',
            'O3': 'O3'
        }
        sub_df = df[list(cols_map.keys())].rename(columns=cols_map)
        corr = sub_df.corr().round(2)

        corr_dict = {}
        for col in corr.columns:
            corr_dict[col] = {}
            for row_idx in corr.index:
                corr_dict[col][row_idx] = float(corr.loc[row_idx, col])
        _cached_correlation_matrix = corr_dict

        # 2. Season-wise AQI (Standard IMD Mapping: Dec-Feb, Mar-May, Jun-Sep, Oct-Nov)
        def get_season(m):
            if m in [12, 1, 2]: return "Winter"
            elif m in [3, 4, 5]: return "Summer"
            elif m in [6, 7, 8, 9]: return "Monsoon"
            else: return "Autumn"

        df['Season'] = df['Month_Num'].apply(get_season)
        season_order = ["Winter", "Summer", "Monsoon", "Autumn"]
        seasonal_series = df.groupby('Season')['AQI'].mean().reindex(season_order)

        _cached_seasonal_aqi = [
            {"season": str(season), "average_aqi": int(round(float(val)))}
            for season, val in seasonal_series.items()
        ]

        # 3. Load generated top_features.json
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                _cached_top_features = json.load(f)
        else:
            # Fallback to brain artifacts location
            brain_json_path = os.path.join(project_root, "artifacts", "shap", "top_features.json")
            if os.path.exists(brain_json_path):
                with open(brain_json_path, "r", encoding="utf-8") as f:
                    _cached_top_features = json.load(f)
            else:
                _cached_top_features = []

        logger.info("Successfully computed dataset analytics & loaded SHAP top_features.json.")
        return _cached_correlation_matrix, _cached_seasonal_aqi, _cached_top_features

    except Exception as e:
        logger.error(f"Failed to compute dataset analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics dataset processing failed: {str(e)}"
        )


@router.get("/", status_code=status.HTTP_200_OK)
def get_historical_analytics():
    """
    Returns live criteria pollutant telemetry, Pearson correlation matrix, season-wise AQI distribution, and dynamic SHAP explainability.
    """
    t0 = time.time()
    logger.info("Serving live analytics API request.")
    correlation_matrix, seasonal_aqi, top_features = _load_historical_analytics()
    raw = get_live_pollutants()

    pm25 = raw.get("PM25", raw.get("pm2_5", 7.35))
    pm10 = raw.get("PM10", raw.get("pm10", 9.94))
    no2 = raw.get("NO2", raw.get("no2", 5.43))
    so2 = raw.get("SO2", raw.get("so2", 1.33))
    co_raw = raw.get("CO", raw.get("co", 159.67))
    co_mg = round(co_raw / 1000.0, 2) if co_raw > 10 else round(co_raw, 2)
    o3 = raw.get("O3", raw.get("o3", 40.56))

    latency_ms = round((time.time() - t0) * 1000.0, 2)

    # Verify SHAP static asset paths
    static_shap_dir = os.path.join(os.path.dirname(__file__), "..", "static", "shap")
    summary_plot_exists = os.path.exists(os.path.join(static_shap_dir, "shap_summary_plot.png"))
    importance_plot_exists = os.path.exists(os.path.join(static_shap_dir, "global_feature_importance.png"))

    shap_payload = None
    if summary_plot_exists:
        shap_payload = {
            "model_name": "24-Hour Forecast XGBoost Model (models/hourly/model.pkl)",
            "feature_count": 43,
            "explainer_type": "shap.TreeExplainer",
            "summary_plot_url": "/static/shap/shap_summary_plot.png",
            "feature_importance_plot_url": "/static/shap/global_feature_importance.png" if importance_plot_exists else None,
            "explanation": "The SHAP summary plot explains how each pollutant contributes to AQI predictions. Higher SHAP values indicate a stronger influence on the model output.",
            "top_features": top_features
        }

    response_payload = {
        "live_pollutants": [
            {"name": "PM2.5", "value": round(float(pm25), 2), "unit": "µg/m³"},
            {"name": "PM10", "value": round(float(pm10), 2), "unit": "µg/m³"},
            {"name": "NO2", "value": round(float(no2), 2), "unit": "µg/m³"},
            {"name": "SO2", "value": round(float(so2), 2), "unit": "µg/m³"},
            {"name": "CO", "value": round(float(co_mg), 2), "unit": "mg/m³"},
            {"name": "O3", "value": round(float(o3), 2), "unit": "µg/m³"}
        ],
        "seasonal_aqi": seasonal_aqi,
        "correlation_matrix": correlation_matrix,
        "shap_explainability": shap_payload,
        "latency_ms": latency_ms
    }

    logger.info(f"ANALYTICS BACKEND RESPONSE PAYLOAD: seasonal_aqi={seasonal_aqi}, correlation_matrix_keys={list(correlation_matrix.keys())}, shap_available={shap_payload is not None}, latency_ms={latency_ms}")

    return response_payload
