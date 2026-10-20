from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class FactorContribution(BaseModel):
    factor: str
    impact: float
    description: str

class PredictionBase(BaseModel):
    prediction_id: str
    aircraft_id: str
    component_type: str
    timestamp: datetime
    anomaly_score: float
    anomaly_detected: bool
    anomaly_severity: str
    maintenance_probability: float
    risk_level: str
    predicted_rul_hours: float
    rul_lower_bound: float
    rul_upper_bound: float
    confidence: float
    top_contributing_factors: List[Dict[str, Any]] = []
    recommended_action: str
    model_mode: str

    class Config:
        from_attributes = True

class PredictionSummary(BaseModel):
    total_anomalies: int
    high_risk_count: int
    critical_risk_count: int
    low_rul_count: int
    predictions: List[PredictionBase]
