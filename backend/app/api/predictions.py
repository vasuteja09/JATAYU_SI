from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.prediction_service import prediction_service

router = APIRouter(tags=["Predictions & Inference"])

@router.get("/predictions")
def get_predictions(
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    preds = prediction_service.get_all_predictions(db, risk_level)
    return {
        "total": len(preds),
        "predictions": preds
    }

@router.post("/predict/{aircraft_id}")
def run_prediction_endpoint(
    aircraft_id: str,
    component_type: str = Query("HYDRAULIC"),
    db: Session = Depends(get_db)
):
    try:
        result = prediction_service.run_prediction_for_aircraft(db, aircraft_id, component_type)
        return {
            "success": True,
            "prediction": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
