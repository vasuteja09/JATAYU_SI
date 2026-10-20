from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
def get_alerts(
    severity: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    alerts = alert_service.get_all_alerts(db, severity, unread_only)
    return {
        "total": len(alerts),
        "alerts": alerts
    }

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert_endpoint(alert_id: str, db: Session = Depends(get_db)):
    try:
        return alert_service.acknowledge_alert(db, alert_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
