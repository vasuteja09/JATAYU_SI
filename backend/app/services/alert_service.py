from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import datetime

from app.db.models import Alert

class AlertService:
    @staticmethod
    def get_all_alerts(db: Session, severity: Optional[str] = None, unread_only: bool = False) -> List[Dict[str, Any]]:
        query = db.query(Alert).order_by(Alert.timestamp.desc())
        if severity:
            query = query.filter(Alert.severity == severity)
        if unread_only:
            query = query.filter(Alert.acknowledged == False)

        alerts = query.all()
        return [{
            "alert_id": a.alert_id,
            "aircraft_id": a.aircraft_id,
            "component_type": a.component_type,
            "severity": a.severity,
            "title": a.title,
            "reason": a.reason,
            "recommended_action": a.recommended_action,
            "timestamp": a.timestamp.isoformat(),
            "acknowledged": a.acknowledged
        } for a in alerts]

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str) -> Dict[str, Any]:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            raise ValueError(f"Alert {alert_id} not found")
        alert.acknowledged = True
        db.commit()
        return {"success": True, "alert_id": alert_id, "acknowledged": True}

alert_service = AlertService()
