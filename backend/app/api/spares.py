from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.services.logistics_service import logistics_service
from app.auth import require_role

router = APIRouter(prefix="/spares", tags=["Logistics & Spare Parts"])


class ReserveRequest(BaseModel):
    part_id: str
    aircraft_id: str
    quantity: int = 1


class StockUpdateRequest(BaseModel):
    adjustment: int          # positive = restock, negative = usage/write-off
    reason: str = "Manual stock adjustment"


# ─── Existing endpoints ───────────────────────────────────────────────────────

@router.get("")
def get_spares(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    parts = logistics_service.get_inventory(db, status)
    return {
        "total": len(parts),
        "inventory": parts
    }


@router.get("/shortages")
def get_spare_shortages(db: Session = Depends(get_db)):
    shortages = logistics_service.get_shortage_alerts(db)
    return {
        "total_shortages": len(shortages),
        "alerts": shortages
    }


@router.post("/reserve")
def reserve_part(req: ReserveRequest, db: Session = Depends(get_db)):
    try:
        res = logistics_service.reserve_spare(db, req.part_id, req.aircraft_id, req.quantity)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── New endpoint ─────────────────────────────────────────────────────────────

@router.patch(
    "/{part_id}/stock",
    summary="Update spare part stock quantity (Spares Dept or Demo role)",
    dependencies=[Depends(require_role("spares", "demo"))],
)
def update_spare_stock(
    part_id: str,
    req: StockUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Adjusts the stock quantity of a spare part.
    Positive adjustment = restock. Negative = usage or write-off.
    Accessible by: spares department, demo.
    """
    from app.db.models import SparePart, SpareTransaction
    import datetime

    part = db.query(SparePart).filter(SparePart.part_id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail=f"Part {part_id} not found.")

    if req.adjustment == 0:
        raise HTTPException(status_code=400, detail="Adjustment must be non-zero.")

    new_qty = part.quantity + req.adjustment
    if new_qty < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Adjustment would result in negative stock ({new_qty}). Current stock: {part.quantity}.",
        )

    old_qty = part.quantity
    part.quantity = new_qty

    # Recalculate status
    if new_qty <= 0:
        part.status = "CRITICAL_SHORTAGE"
    elif new_qty <= part.minimum_stock:
        part.status = "LOW_STOCK"
    else:
        part.status = "AVAILABLE"

    # Record transaction
    tx_type = "RESTOCK" if req.adjustment > 0 else "USAGE"
    tx = SpareTransaction(
        transaction_id=f"TX-ADJ-{int(datetime.datetime.utcnow().timestamp())}",
        part_id=part.part_id,
        aircraft_id=None,
        transaction_type=tx_type,
        quantity=abs(req.adjustment),
        source_location=part.storage_location,
        dest_location=part.storage_location,
        timestamp=datetime.datetime.utcnow(),
        status="COMPLETED",
    )
    db.add(tx)
    db.commit()
    db.refresh(part)

    return {
        "success": True,
        "part_id": part_id,
        "part_name": part.part_name,
        "previous_quantity": old_qty,
        "adjustment": req.adjustment,
        "new_quantity": part.quantity,
        "new_status": part.status,
        "reason": req.reason,
        "message": f"Stock for {part.part_name} updated: {old_qty} → {part.quantity}.",
    }
