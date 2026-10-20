from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    alert_id: str
    aircraft_id: str
    component_type: Optional[str] = None
    severity: str
    title: str
    reason: str
    recommended_action: str
    timestamp: datetime
    acknowledged: bool

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged: bool = True
