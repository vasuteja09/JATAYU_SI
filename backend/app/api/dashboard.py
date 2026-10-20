from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.fleet_service import fleet_service
from app.services.maintenance_service import maintenance_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    summary = fleet_service.get_fleet_summary(db)
    top_risk = fleet_service.get_top_risk_aircraft(db, limit=5)
    trend = fleet_service.get_availability_trend(db)
    recommendations = maintenance_service.get_recommendations(db)[:3]

    # Maintenance forecast next 4 weeks
    forecast = [
        {"period": "Week 1", "scheduled": 4, "predicted_unplanned": 2},
        {"period": "Week 2", "scheduled": 3, "predicted_unplanned": 1},
        {"period": "Week 3", "scheduled": 5, "predicted_unplanned": 3},
        {"period": "Week 4", "scheduled": 2, "predicted_unplanned": 1}
    ]

    return {
        "kpis": summary,
        "availability_trend": trend,
        "health_distribution": summary["health_distribution"],
        "top_risk_aircraft": top_risk,
        "maintenance_forecast": forecast,
        "key_recommendations": recommendations,
        "data_provenance_note": "Prototype uses public/synthetic aerospace data for demonstration. Real operational defence aircraft data is not used."
    }
