import datetime
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.db.models import SparePart, SpareTransaction, Aircraft

class LogisticsService:
    @staticmethod
    def get_inventory(db: Session, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(SparePart)
        if status_filter:
            query = query.filter(SparePart.status == status_filter)
        parts = query.all()

        results = []
        for p in parts:
            results.append({
                "part_id": p.part_id,
                "part_name": p.part_name,
                "compatible_component_type": p.compatible_component_type,
                "quantity": p.quantity,
                "reserved_quantity": p.reserved_quantity,
                "storage_location": p.storage_location,
                "minimum_stock": p.minimum_stock,
                "lead_time_days": p.lead_time_days,
                "status": p.status
            })
        return results

    @staticmethod
    def get_shortage_alerts(db: Session) -> List[Dict[str, Any]]:
        # Fetch parts with 0 stock or below minimum stock
        shortages = db.query(SparePart).filter(
            SparePart.status.in_(["CRITICAL_SHORTAGE", "LOW_STOCK"])
        ).all()

        alerts = []
        for s in shortages:
            # Check if an alternative depot holds this part
            alternative = db.query(SparePart).filter(
                SparePart.part_name == s.part_name,
                SparePart.part_id != s.part_id,
                SparePart.quantity > 0
            ).first()

            if alternative:
                alt_loc = alternative.storage_location
                alt_qty = alternative.quantity
                recommendation = f"Initiate inter-depot transfer of 1 unit from {alt_loc} (Stock: {alt_qty}). Est. transfer time: {alternative.lead_time_days} days."
            else:
                alt_loc = None
                alt_qty = 0
                recommendation = f"Expedite procurement order to OEM. Current lead time: {s.lead_time_days} days."

            alerts.append({
                "part_id": s.part_id,
                "part_name": s.part_name,
                "compatible_component_type": s.compatible_component_type,
                "affected_aircraft_id": "A101 / A126" if s.compatible_component_type == "HYDRAULIC" else "A118",
                "local_stock": s.quantity,
                "depot_stock": alt_qty,
                "alternative_location": alt_loc,
                "lead_time_days": s.lead_time_days,
                "shortage_level": "CRITICAL" if s.quantity == 0 else "WARNING",
                "recommendation": recommendation
            })
        return alerts

    @staticmethod
    def reserve_spare(db: Session, part_id: str, aircraft_id: str, quantity: int = 1) -> Dict[str, Any]:
        part = db.query(SparePart).filter(SparePart.part_id == part_id).first()
        if not part:
            raise ValueError(f"Part {part_id} not found in inventory")

        if part.quantity < quantity:
            # Check alternative location
            alt = db.query(SparePart).filter(
                SparePart.part_name == part.part_name,
                SparePart.part_id != part.part_id,
                SparePart.quantity >= quantity
            ).first()

            if alt:
                # Transfer & Reserve from alternative
                alt.quantity -= quantity
                alt.reserved_quantity += quantity
                tx = SpareTransaction(
                    transaction_id=f"TX-TRF-{int(datetime.datetime.utcnow().timestamp())}",
                    part_id=alt.part_id,
                    aircraft_id=aircraft_id,
                    transaction_type="TRANSFER",
                    quantity=quantity,
                    source_location=alt.storage_location,
                    dest_location=part.storage_location,
                    timestamp=datetime.datetime.utcnow(),
                    status="IN_TRANSIT"
                )
                db.add(tx)
                db.commit()
                return {
                    "success": True,
                    "action": "INTER_DEPOT_TRANSFER",
                    "message": f"Transferred {quantity} unit(s) of {part.part_name} from {alt.storage_location} to {part.storage_location} for {aircraft_id}."
                }
            else:
                return {
                    "success": False,
                    "action": "SHORTAGE",
                    "message": f"Insufficient stock across all depots for {part.part_name}. Procurement order required."
                }

        part.quantity -= quantity
        part.reserved_quantity += quantity
        if part.quantity <= 0:
            part.status = "CRITICAL_SHORTAGE"
        elif part.quantity <= part.minimum_stock:
            part.status = "LOW_STOCK"

        tx = SpareTransaction(
            transaction_id=f"TX-RES-{int(datetime.datetime.utcnow().timestamp())}",
            part_id=part.part_id,
            aircraft_id=aircraft_id,
            transaction_type="RESERVE",
            quantity=quantity,
            source_location=part.storage_location,
            dest_location=f"Aircraft {aircraft_id} Bay",
            timestamp=datetime.datetime.utcnow(),
            status="COMPLETED"
        )
        db.add(tx)
        db.commit()

        return {
            "success": True,
            "action": "RESERVED",
            "message": f"Successfully reserved {quantity} unit of {part.part_name} for Aircraft {aircraft_id}."
        }

logistics_service = LogisticsService()
