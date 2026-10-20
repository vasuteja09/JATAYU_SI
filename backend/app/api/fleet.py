import re
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.fleet_service import fleet_service

router = APIRouter(prefix="/fleet", tags=["Fleet"])

# Valid status values for aircraft
_VALID_STATUSES = {"AVAILABLE", "MAINTENANCE", "GROUNDED", "STANDBY", "IN_SERVICE"}
# Valid aircraft type pattern
_TYPE_PATTERN = re.compile(r"^[A-Za-z0-9\-_\s]{1,50}$")


@router.get("")
def get_fleet(
    aircraft_type: Optional[str] = Query(None, max_length=50),
    status: Optional[str] = Query(None, max_length=30),
    search: Optional[str] = Query(None, max_length=100),
    db: Session = Depends(get_db)
):
    if aircraft_type and not _TYPE_PATTERN.match(aircraft_type):
        raise HTTPException(status_code=400, detail="Invalid aircraft_type format.")
    if status and status.upper() not in _VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid values: {sorted(_VALID_STATUSES)}")

    aircraft_list = fleet_service.get_all_aircraft(db, aircraft_type, status, search)
    summary = fleet_service.get_fleet_summary(db)
    return {
        "summary": summary,
        "total": len(aircraft_list),
        "aircraft": aircraft_list
    }


@router.get("/summary")
def get_fleet_summary_endpoint(db: Session = Depends(get_db)):
    return fleet_service.get_fleet_summary(db)


@router.get("/availability-trend")
def get_availability_trend_endpoint(db: Session = Depends(get_db)):
    return fleet_service.get_availability_trend(db)
