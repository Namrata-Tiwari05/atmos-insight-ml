import os
import time
import json
import joblib
from app.core.logging import get_logger

logger = get_logger("model_loader")

class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def initialize(self):
        """
        Loads models and scalers from disk into memory exactly once at application startup.
        """
        if self.initialized:
            logger.info("Models are already initialized and cached in memory.")
            return

        logger.info("Initializing models and scalers loading sequence...")
        start_time = time.time()

        # Define directory root fallback checks
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
        models_base_dir = os.path.join(project_root, "models")
        if not os.path.exists(models_base_dir):
            # Fallback to local app level directory
            models_base_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "../../models")

        logger.info(f"Using models base directory: {models_base_dir}")

        # Paths
        current_model_path = os.path.join(models_base_dir, "current", "model.pkl")
        current_scaler_path = os.path.join(models_base_dir, "current", "scaler.pkl")
        current_meta_path = os.path.join(models_base_dir, "current", "metadata.json")

        hourly_model_path = os.path.join(models_base_dir, "hourly", "model.pkl")
        hourly_scaler_path = os.path.join(models_base_dir, "forecasting_scaler.pkl")
        if not os.path.exists(hourly_scaler_path):
            hourly_scaler_path = os.path.join(models_base_dir, "hourly", "scaler.pkl")
        hourly_meta_path = os.path.join(models_base_dir, "hourly", "metadata.json")

        daily_model_path = os.path.join(models_base_dir, "daily", "model.pkl")
        daily_scaler_path = os.path.join(models_base_dir, "daily", "scaler.pkl")

        # 1. Load Current Model Assets
        self.current_model = self._load_file(current_model_path, "Current AQI Model")
        self.current_scaler = self._load_file(current_scaler_path, "Current AQI Scaler")
        self.current_meta = self._load_json(current_meta_path, "Current AQI Metadata")

        # 2. Load Hourly Model Assets
        self.hourly_model = self._load_file(hourly_model_path, "Hourly Forecasting Model")
        self.hourly_scaler = self._load_file(hourly_scaler_path, "Hourly Forecasting Scaler")
        self.hourly_meta = self._load_json(hourly_meta_path, "Hourly Forecasting Metadata")

        # 3. Load Daily Model Assets
        self.daily_model = self._load_file(daily_model_path, "Daily Forecasting Model")
        self.daily_scaler = self._load_file(daily_scaler_path, "Daily Forecasting Scaler")
        daily_meta_path = os.path.join(models_base_dir, "daily", "metadata.json")
        self.daily_meta = self._load_json(daily_meta_path, "Daily Forecasting Metadata")

        # Validation Checks
        self._validate_assets()

        self.initialized = True
        loading_time = time.time() - start_time
        logger.info(f"SUCCESS: All models loaded successfully in {loading_time:.2f} seconds.")

    def _load_file(self, path, name):
        if not os.path.exists(path):
            logger.error(f"Missing File: {name} not found at {path}")
            raise FileNotFoundError(f"Required model asset '{name}' missing from disk.")
        try:
            return joblib.load(path)
        except Exception as e:
            logger.error(f"Corruption: Failed to deserialize {name}. Error: {str(e)}")
            raise RuntimeError(f"Failed to load corrupt model asset '{name}'.")

    def _load_json(self, path, name):
        if not os.path.exists(path):
            logger.error(f"Missing File: {name} not found at {path}")
            raise FileNotFoundError(f"Required metadata asset '{name}' missing from disk.")
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Corruption: Failed to parse {name}. Error: {str(e)}")
            raise RuntimeError(f"Failed to parse metadata asset '{name}'.")

    def _validate_assets(self):
        # Validate Current model feature presence
        if "features" not in self.current_meta:
            raise KeyError("Current AQI metadata missing 'features' list.")
            
        # Validate Hourly model feature presence
        if "features" not in self.hourly_meta:
            raise KeyError("Hourly forecasting metadata missing 'features' list.")
            
        logger.info("Assets validation completed successfully. Feature order matrices parsed.")

    # Getters
    def get_current_model(self):
        return self.current_model

    def get_current_scaler(self):
        return self.current_scaler

    def get_current_features(self) -> list:
        return self.current_meta["features"]

    def get_hourly_model(self):
        return self.hourly_model

    def get_hourly_scaler(self):
        return self.hourly_scaler

    def get_hourly_features(self) -> list:
        return self.hourly_meta["features"]

    def get_daily_model(self):
        return self.daily_model

    def get_daily_scaler(self):
        return self.daily_scaler

    def get_daily_features(self) -> list:
        return self.daily_meta.get("features", [])

# Expose a global loader instance
model_loader = ModelLoader()
