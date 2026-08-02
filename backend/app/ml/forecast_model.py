import time
import pandas as pd
from app.ml.model_loader import model_loader
from app.core.logging import get_logger

logger = get_logger("forecast_model")

def forecast_next_hour(features_dict: dict) -> float:
    """
    Validates, scales, and forecasts the next hour's AQI value (single step).
    Does not run recursive forecasting.
    """
    if not model_loader.initialized:
        model_loader.initialize()
        
    start_time = time.time()
    
    # Retrieve cached components
    model = model_loader.get_hourly_model()
    scaler = model_loader.get_hourly_scaler()
    req_features = model_loader.get_hourly_features()
    
    # Check for missing features
    missing = [f for f in req_features if f not in features_dict]
    if missing:
        logger.error(f"Inference Failure: Missing feature inputs for hourly model: {missing}")
        raise ValueError(f"Feature mismatch: Missing required inputs: {missing}")
        
    # Build dataframe preserving feature columns order exactly
    df_in = pd.DataFrame([features_dict])[req_features]
    
    # Standardize features using pre-loaded scaler
    try:
        # Note: features_dict already comes pre-scaled from preprocess, but if we need to apply scaling
        # we do it here. Let's transform variables using the hourly scaler.
        # Wait, the scaler expects a dataframe containing all training features.
        # df_in matches the scaler's features order exactly.
        df_scaled = pd.DataFrame(scaler.transform(df_in), columns=req_features)
    except Exception as e:
        logger.error(f"Scaling failure during hourly inference: {str(e)}")
        raise RuntimeError(f"Hourly feature standardization failed: {str(e)}")
        
    # Execute prediction
    try:
        prediction = model.predict(df_scaled)[0]
    except Exception as e:
        logger.error(f"Hourly model prediction execution failed: {str(e)}")
        raise RuntimeError(f"Hourly prediction execution failed: {str(e)}")
        
    prediction_time = time.time() - start_time
    logger.info(f"Forecasted next hour AQI: {prediction:.2f} in {prediction_time:.4f} seconds.")
    
    return float(prediction)


def forecast_next_day(features_dict: dict) -> float:
    """
    Validates, scales, and forecasts daily AQI using the trained 7-day XGBoost model.
    """
    if not model_loader.initialized:
        model_loader.initialize()
        
    start_time = time.time()
    
    model = model_loader.get_daily_model()
    scaler = model_loader.get_daily_scaler()
    model_features = list(model.feature_names_in_)
    scaler_features = list(scaler.feature_names_in_)
    
    missing = [f for f in model_features if f not in features_dict]
    if missing:
        logger.error(f"Inference Failure: Missing feature inputs for daily model: {missing}")
        raise ValueError(f"Feature mismatch: Missing required inputs: {missing}")
        
    df_full = pd.DataFrame([features_dict])
    df_scaler_in = df_full[scaler_features]
    df_scaler_out = pd.DataFrame(scaler.transform(df_scaler_in), columns=scaler_features)

    df_model_in = pd.DataFrame()
    for col in model_features:
        if col in scaler_features:
            df_model_in[col] = df_scaler_out[col]
        else:
            df_model_in[col] = df_full[col]

    try:
        prediction = model.predict(df_model_in)[0]
    except Exception as e:
        logger.error(f"Daily model prediction execution failed: {str(e)}")
        raise RuntimeError(f"Daily prediction execution failed: {str(e)}")
        
    prediction_time = time.time() - start_time
    logger.info(f"Forecasted daily AQI: {prediction:.2f} in {prediction_time:.4f} seconds.")
    
    return float(prediction)
