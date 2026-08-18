from __future__ import annotations
import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy import insert, select, update
from typing import Optional, Dict, Any

from app.services.database_service import _engine, waybill_documents_table, custody_events_table
from app.services.audit_service import audit_service
from app.services.domain_events import emit_event_sync

class WaybillService:
    @staticmethod
    def _generate_hash(data: str) -> str:
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    @staticmethod
    def create_waybill(
        batch_id: str,
        sku: str,
        quantity: int,
        order_id: str,
        initial_custodian: str,
        actor_id: str,
        actor_role: str
    ) -> dict:
        timestamp = datetime.now(timezone.utc)
        waybill_id = f"WAY-{str(uuid.uuid4())[:8].upper()}"
        
        with _engine().begin() as conn:
            result = conn.execute(
                insert(waybill_documents_table).values(
                    waybill_id=waybill_id,
                    batch_id=batch_id,
                    sku=sku,
                    quantity=quantity,
                    order_id=order_id,
                    current_custodian=initial_custodian,
                    status="CREATED",
                    created_at=timestamp,
                    updated_at=timestamp
                )
            )
            
            # Initial Custody Event
            event_hash = WaybillService._generate_hash(f"{waybill_id}:CREATE:{initial_custodian}:{timestamp.isoformat()}")
            conn.execute(
                insert(custody_events_table).values(
                    waybill_id=waybill_id,
                    event_type="CREATE",
                    from_custodian=None,
                    to_custodian=initial_custodian,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    quantity=quantity,
                    event_hash=event_hash,
                    created_at=timestamp
                )
            )

        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="WAYBILL_CREATED",
            entity="WAYBILL",
            entity_id=waybill_id,
            new_value={"status": "CREATED", "custodian": initial_custodian}
        )
            
        emit_event_sync(
            "WAYBILL_CREATED",
            {"waybill_id": waybill_id, "status": "CREATED", "current_custodian": initial_custodian},
            notify_roles=["transporter", "dealer", "admin"],
            notify_title="Waybill Created",
            notify_message=f"Waybill {waybill_id} has been created."
        )

        return {
            "waybill_id": waybill_id,
            "status": "CREATED",
            "current_custodian": initial_custodian
        }

    @staticmethod
    def seal_waybill(waybill_id: str, actor_id: str, actor_role: str) -> dict:
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            row = conn.execute(
                select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)
            ).first()
            
            if not row:
                raise ValueError("Waybill not found")
                
            raw_data = f"{row.waybill_id}:{row.batch_id}:{row.sku}:{row.quantity}:{timestamp.isoformat()}"
            seal_hash = WaybillService._generate_hash(raw_data)
            qr_code = f"QR-{seal_hash[:16]}"
            
            conn.execute(
                update(waybill_documents_table)
                .where(waybill_documents_table.c.waybill_id == waybill_id)
                .values(
                    status="SEALED",
                    seal_hash=seal_hash,
                    qr_code=qr_code,
                    updated_at=timestamp
                )
            )

        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="WAYBILL_SEALED",
            entity="WAYBILL",
            entity_id=waybill_id,
            old_value={"status": row.status},
            new_value={"status": "SEALED", "seal_hash": seal_hash}
        )
        
        emit_event_sync(
            "WAYBILL_SEALED",
            {"waybill_id": waybill_id, "status": "SEALED"}
        )

        return {
            "waybill_id": waybill_id,
            "status": "SEALED",
            "seal_hash": seal_hash,
            "qr_code": qr_code
        }

    @staticmethod
    def transfer_custody(
        waybill_id: str, 
        new_custodian: str, 
        actor_id: str, 
        actor_role: str,
        location: Optional[str] = None
    ) -> dict:
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            row = conn.execute(
                select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)
            ).first()
            
            if not row:
                raise ValueError("Waybill not found")
                
            old_custodian = row.current_custodian
            
            conn.execute(
                update(waybill_documents_table)
                .where(waybill_documents_table.c.waybill_id == waybill_id)
                .values(
                    current_custodian=new_custodian,
                    status="IN_TRANSIT",
                    updated_at=timestamp
                )
            )
            
            event_hash = WaybillService._generate_hash(f"{waybill_id}:TRANSFER:{old_custodian}:{new_custodian}:{timestamp.isoformat()}")
            
            conn.execute(
                insert(custody_events_table).values(
                    waybill_id=waybill_id,
                    event_type="TRANSFER",
                    from_custodian=old_custodian,
                    to_custodian=new_custodian,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    quantity=row.quantity,
                    location=location,
                    event_hash=event_hash,
                    created_at=timestamp
                )
            )

        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="CUSTODY_TRANSFERRED",
            entity="WAYBILL",
            entity_id=waybill_id,
            old_value={"custodian": old_custodian, "status": row.status},
            new_value={"custodian": new_custodian, "status": "IN_TRANSIT"}
        )
            
        return {
            "waybill_id": waybill_id,
            "status": "IN_TRANSIT",
            "from_custodian": old_custodian,
            "to_custodian": new_custodian
        }

    @staticmethod
    def verify_waybill(waybill_id: str, seal_hash: str) -> dict:
        with _engine().begin() as conn:
            row = conn.execute(
                select(waybill_documents_table).where(waybill_documents_table.c.waybill_id == waybill_id)
            ).first()
            
            if not row:
                return {
                    "is_valid": False,
                    "current_status": "NOT_FOUND",
                    "custody": "Unknown",
                    "reason": "Waybill ID does not exist"
                }
                
            if row.seal_hash != seal_hash:
                return {
                    "is_valid": False,
                    "current_status": "TAMPERED",
                    "custody": row.current_custodian,
                    "reason": "Cryptographic seal mismatch"
                }
                
            return {
                "is_valid": True,
                "current_status": row.status,
                "custody": row.current_custodian,
                "batch_id": row.batch_id,
                "sku": row.sku,
                "quantity": row.quantity
            }

waybill_service = WaybillService()
