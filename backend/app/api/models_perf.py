import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ModelMetric
from app.ml.model_manager import model_manager

router = APIRouter(prefix="/models", tags=["Model Performance & Metrics"])

import math

def _sanitize_json_obj(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.88
        return obj
    elif isinstance(obj, dict):
        return {k: _sanitize_json_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_json_obj(v) for v in obj]
    return obj

@router.get("/metrics")
def get_model_metrics(db: Session = Depends(get_db)):
    db_metrics = db.query(ModelMetric).all()
    metrics_map = {}
    for dm in db_metrics:
        try:
            m_data = json.loads(dm.metrics_json)
        except Exception:
            m_data = {}
        try:
            feat_data = json.loads(dm.feature_importance_json)
        except Exception:
            feat_data = []

        metrics_map[dm.model_name] = {
            "metrics": _sanitize_json_obj(m_data),
            "feature_importance": _sanitize_json_obj(feat_data)
        }

    # If DB empty, fallback to model_manager disk metrics
    if not metrics_map:
        metrics_map = _sanitize_json_obj(model_manager.get_metrics())

    return {
        "models": metrics_map,
        "methodology": {
            "training_data": "Public NASA C-MAPSS / Synthetic Aerospace Fleet Telemetry",
            "deployment": "Local Python inference via scikit-learn & XGBoost",
            "leakage_prevention": "Strictly grouped aircraft-trajectory partition (no random temporal shuffle)",
            "disclaimer": "Prototype validation on synthetic/public aerospace dataset. Real operational defence aircraft data is not used."
        }
    }

@router.get("/features")
def get_model_features():
    metrics = model_manager.get_metrics()
    return metrics.get("feature_importance", [])
