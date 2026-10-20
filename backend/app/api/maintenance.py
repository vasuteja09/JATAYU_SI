from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.services.maintenance_service import maintenance_service
from app.services.optimization_service import optimization_service
from app.auth import require_role

router = APIRouter(prefix="/maintenance", tags=["Maintenance Planning & Optimization"])


# ─── Existing endpoints ───────────────────────────────────────────────────────

@router.get("/queue")
def get_maintenance_queue_endpoint(db: Session = Depends(get_db)):
    queue = maintenance_service.get_maintenance_queue(db)
    return {
        "total_queued": len(queue),
        "tasks": queue
    }


@router.get("/recommendations")
def get_recommendations_endpoint(db: Session = Depends(get_db)):
    recs = maintenance_service.get_recommendations(db)
    return {
        "total": len(recs),
        "recommendations": recs
    }


@router.get("/schedule")
def get_schedule_endpoint(db: Session = Depends(get_db)):
    queue = maintenance_service.get_maintenance_queue(db)
    return {
        "schedule": queue
    }


@router.post("/optimize")
def optimize_schedule_endpoint(db: Session = Depends(get_db)):
    result = optimization_service.optimize_maintenance_schedule(db)
    return result


# ─── New endpoints ────────────────────────────────────────────────────────────

# Valid status transitions — only these are allowed server-side
_VALID_TRANSITIONS = {
    "QUEUED": {"SCHEDULED", "IN_PROGRESS"},
    "SCHEDULED": {"IN_PROGRESS", "WAITING_FOR_SPARE"},
    "IN_PROGRESS": {"COMPLETED", "WAITING_FOR_SPARE"},
    "WAITING_FOR_SPARE": {"SCHEDULED", "IN_PROGRESS"},
    "COMPLETED": set(),  # Terminal state
}


class TaskStatusUpdateRequest(BaseModel):
    new_status: str
    notes: str = ""


@router.patch(
    "/tasks/{task_id}/status",
    summary="Update maintenance task status (Technician or Demo role)",
    dependencies=[Depends(require_role("technician", "commander", "demo"))],
)
def update_task_status(
    task_id: str,
    req: TaskStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Updates the status of a maintenance task.
    Only valid status transitions are permitted (enforced server-side).
    Accessible by: technician, commander, demo.
    """
    from app.db.models import MaintenanceTask

    task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    new_status = req.new_status.upper()
    current_status = (task.status or "QUEUED").upper()
    allowed_next = _VALID_TRANSITIONS.get(current_status, set())

    if new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: {current_status} → {new_status}. "
                f"Allowed transitions from {current_status}: {sorted(allowed_next) or 'none (terminal state)'}."
            ),
        )

    task.status = new_status
    db.commit()
    db.refresh(task)

    return {
        "success": True,
        "task_id": task_id,
        "previous_status": current_status,
        "new_status": new_status,
        "message": f"Task {task_id} updated from {current_status} to {new_status}.",
    }


class InspectionRequest(BaseModel):
    aircraft_id: str
    component_id: str
    task_name: str = ""
    reason: str = ""


@router.post(
    "/request",
    summary="Create inspection maintenance request based on prediction (Commander, Tech, or Demo)",
    dependencies=[Depends(require_role("commander", "technician", "demo"))],
)
def create_inspection_request_endpoint(
    req: InspectionRequest,
    db: Session = Depends(get_db),
):
    """
    Creates an authorized inspection maintenance task in the queue.
    Prevents duplicate active requests for the same aircraft and component.
    Preserves queue priority ordering.
    """
    import datetime
    from app.db.models import Aircraft, Component, Prediction, MaintenanceTask, SparePart

    # 1. Validate aircraft exists
    ac = db.query(Aircraft).filter(Aircraft.aircraft_id == req.aircraft_id).first()
    if not ac:
        raise HTTPException(status_code=404, detail=f"Aircraft '{req.aircraft_id}' not found.")

    # 2. Prevent duplicate active requests for same aircraft & component
    existing_task = db.query(MaintenanceTask).filter(
        MaintenanceTask.aircraft_id == req.aircraft_id,
        MaintenanceTask.component_id == req.component_id,
        MaintenanceTask.status.in_(["QUEUED", "SCHEDULED", "IN_PROGRESS"]),
    ).first()

    if existing_task:
        raise HTTPException(
            status_code=409,
            detail=(
                f"An active maintenance task ({existing_task.task_id}) already exists for "
                f"Aircraft {req.aircraft_id} - Component {req.component_id} with status '{existing_task.status}'."
            ),
        )

    # 3. Retrieve prediction or component details
    pred = db.query(Prediction).filter(
        Prediction.aircraft_id == req.aircraft_id,
        Prediction.component_type.ilike(f"%{req.component_id.split('-')[0]}%"),
    ).order_by(Prediction.timestamp.desc()).first()

    failure_prob = pred.maintenance_probability if pred else 0.65
    rul_hours = pred.predicted_rul_hours if pred else 35.0
    risk_level = pred.risk_level if pred else "HIGH"

    # Compute priority score
    priority_score, priority, rec_reason = maintenance_service.calculate_priority_score(
        failure_prob=failure_prob,
        rul_hours=rul_hours,
        health_score=ac.health_score,
        criticality="HIGH",
        spare_available=True,
    )

    task_name = req.task_name or f"Predictive Inspection: {req.component_id}"
    task_id = f"TASK-{req.aircraft_id}-{req.component_id[:4]}-{int(datetime.datetime.utcnow().timestamp()) % 10000}"

    # Determine required spare part
    part = db.query(SparePart).filter(
        SparePart.compatible_component_type.ilike(f"%{req.component_id.split('-')[0]}%")
    ).first()
    required_part_id = part.part_id if part else None

    # 4. Create new MaintenanceTask in QUEUED status
    new_task = MaintenanceTask(
        task_id=task_id,
        aircraft_id=req.aircraft_id,
        component_id=req.component_id,
        task_name=task_name,
        priority=priority,
        priority_score=priority_score,
        duration_hours=4,
        required_skill=req.component_id.split("-")[0] if "-" in req.component_id else "AVIONICS",
        required_part_id=required_part_id,
        start_time_slot=0,
        end_time_slot=4,
        technician_id=None,
        workshop_id=None,
        rul_deadline_hours=rul_hours,
        is_optimized=False,
        status="QUEUED",
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {
        "success": True,
        "task_id": new_task.task_id,
        "aircraft_id": new_task.aircraft_id,
        "component_id": new_task.component_id,
        "task_name": new_task.task_name,
        "priority": new_task.priority,
        "priority_score": new_task.priority_score,
        "status": new_task.status,
        "message": f"Inspection request successfully queued for {req.aircraft_id} ({req.component_id}).",
    }

