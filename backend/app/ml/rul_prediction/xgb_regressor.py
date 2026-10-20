import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

class RULRegressor:
    def __init__(self, model_path: Optional[Path] = None):
        self.model: Optional[XGBRegressor] = None
        self.model_path = model_path
        if model_path and model_path.exists():
            self.load(model_path)

    def fit(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray) -> Dict[str, Any]:
        self.model = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_val)
        mae = float(mean_absolute_error(y_val, y_pred))
        rmse = float(root_mean_squared_error(y_val, y_pred))

        metrics = {
            "model_type": "XGBoost Regressor (RUL)",
            "unit": "flight hours",
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "test_samples": int(len(y_val)),
            "validation_note": "Prototype validation on synthetic/public dataset. Not operational military data."
        }
        return metrics

    def predict(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        if feature_vector.ndim == 1:
            X = feature_vector.reshape(1, -1)
        else:
            X = feature_vector

        if self.model is not None:
            pred_rul = float(self.model.predict(X)[0])
            pred_rul = max(4.0, pred_rul)
            # Estimate interval based on model confidence
            margin = max(4.0, pred_rul * 0.12)
            lower = max(2.0, pred_rul - margin)
            upper = pred_rul + margin
            model_mode = "ML_INFERENCE"
        else:
            pred_rul = 115.0
            lower = 95.0
            upper = 135.0
            model_mode = "DEMO_FALLBACK"

        return {
            "predicted_rul_hours": round(pred_rul, 1),
            "rul_lower_bound": round(lower, 1),
            "rul_upper_bound": round(upper, 1),
            "confidence_label": "Estimated RUL (Prototype Estimate)",
            "model_mode": model_mode
        }

    def save(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, path)

    def load(self, path: Path):
        self.model = joblib.load(path)
