import time
import pandas as pd
import numpy as np
import shap
from app.ml.model_loader import model_loader
from app.core.logging import get_logger

logger = get_logger("explanation_service")

class SHAPExplanationService:
    """
    Singleton Explainability Service leveraging SHAP TreeExplainer for Random Forest models.
    Provides feature contributions, positive contributors, and negative contributors
    without modifying underlying model prediction outputs.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SHAPExplanationService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        logger.info("Initializing SHAP Explanation Service...")
        model_loader.initialize()
        self.model = model_loader.get_current_model()
        self.scaler = model_loader.get_current_scaler()
        self.feature_columns = model_loader.get_current_features()
        self.scale_cols = ['pm2.5', 'co', 'O3', 'NO2', 'SO2']
        
        # Initialize TreeExplainer ONCE
        t0 = time.time()
        self.explainer = shap.TreeExplainer(self.model)
        self.expected_value = float(np.ravel(self.explainer.expected_value)[0])
        init_time = (time.time() - t0) * 1000.0
        logger.info(f"SUCCESS: TreeExplainer initialized in {init_time:.2f} ms. Expected Value E[f(x)] = {self.expected_value:.2f}")
        self._initialized = True

    def explain_prediction(self, features_dict: dict) -> dict:
        """
        Calculates SHAP values for a single prediction.
        Returns feature contributions, positive contributors, and negative contributors.
        Guarantees zero mutation of predicted target value.
        """
        start_time = time.time()
        
        # Create single-sample dataframe aligned with training feature columns
        df_sample = pd.DataFrame([features_dict])[self.feature_columns].copy()
        
        # Scale continuous features
        df_sample_scaled = df_sample.copy()
        df_sample_scaled[self.scale_cols] = self.scaler.transform(df_sample_scaled[self.scale_cols])
        
        # Compute SHAP values
        shap_res = self.explainer(df_sample_scaled[self.feature_columns])
        shap_values = shap_res.values[0]
        
        contributions = {}
        positive_contributors = []
        negative_contributors = []
        
        total_abs_shap = np.sum(np.abs(shap_values)) + 1e-9
        
        for feat_name, s_val in zip(self.feature_columns, shap_values):
            raw_val = float(features_dict.get(feat_name, 0.0))
            shap_val = float(s_val)
            pct_impact = round((abs(shap_val) / total_abs_shap) * 100.0, 2)
            
            entry = {
                "feature_name": feat_name,
                "feature_value": raw_val,
                "shap_value": round(shap_val, 4),
                "impact_percentage": pct_impact
            }
            
            contributions[feat_name] = entry
            
            if shap_val > 0.01:
                positive_contributors.append({
                    "feature": feat_name,
                    "raw_value": raw_val,
                    "push_aqi_higher_by": round(shap_val, 2)
                })
            elif shap_val < -0.01:
                negative_contributors.append({
                    "feature": feat_name,
                    "raw_value": raw_val,
                    "push_aqi_lower_by": round(abs(shap_val), 2)
                })
                
        # Sort contributors by absolute magnitude
        positive_contributors = sorted(positive_contributors, key=lambda x: x["push_aqi_higher_by"], reverse=True)
        negative_contributors = sorted(negative_contributors, key=lambda x: x["push_aqi_lower_by"], reverse=True)
        
        latency_ms = round((time.time() - start_time) * 1000.0, 2)
        logger.info(f"SHAP explanation generated in {latency_ms} ms.")
        
        return {
            "base_value_expected_aqi": round(self.expected_value, 2),
            "explanation_latency_ms": latency_ms,
            "feature_contributions": contributions,
            "positive_contributors": positive_contributors,
            "negative_contributors": negative_contributors
        }

_shap_service = None

def get_explanation_service():
    global _shap_service
    if _shap_service is None:
        _shap_service = SHAPExplanationService()
    return _shap_service
