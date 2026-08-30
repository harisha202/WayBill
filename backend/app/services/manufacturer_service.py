from __future__ import annotations
from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional

from sqlalchemy import insert, select, update

from app.services.database_service import (
    _engine,
    production_orders_table,
    quality_inspections_table,
    issues_table,
    products_table,
    stock_movements_table,
    audit_logs_table,
    shipments_table,
)
from app.services.audit_service import audit_service
from app.services.waybill_service import waybill_service
from app.services.domain_events import emit_event_sync


class ManufacturerService:
    @staticmethod
    def _generate_id(prefix: str) -> str:
        return f"{prefix}_{uuid.uuid4().hex[:8]}"

    def create_production_order(
        self,
        sku: str,
        quantity: int,
        actor_id: str,
        actor_role: str,
        order_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        order_id = self._generate_id("PRD")
        batch_id = self._generate_id("BCH")
        timestamp = datetime.now(timezone.utc)

        with _engine().begin() as conn:
            values: Dict[str, Any] = dict(
                order_id=order_id,
                batch_id=batch_id,
                sku=sku,
                quantity=quantity,
                status="CREATED",
                qa_status="PENDING",
                created_at=timestamp,
            )
            # Link back to the originating retail/dealer order if provided
            if order_code is not None:
                values["order_code"] = order_code
            conn.execute(insert(production_orders_table).values(**values))

        audit_service.log_action(
            actor_id,
            actor_role,
            "PRODUCTION_CREATED",
            "PRODUCTION_ORDER",
            order_id,
            new_value={"quantity": quantity, "sku": sku, "order_code": order_code},
        )
        emit_event_sync(
            "PRODUCTION_CREATED",
            {
                "order_id": order_id,
                "batch_id": batch_id,
                "sku": sku,
                "quantity": quantity,
                "order_code": order_code,
            },
            notify_roles=["dealer", "admin"],
            notify_title="Production Order Created",
            notify_message=f"Production order {order_id} created for {quantity} of {sku}.",
        )
        return {"order_id": order_id, "batch_id": batch_id, "status": "CREATED", "order_code": order_code}

    def start_production(self, order_id: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)

        with _engine().begin() as conn:
            order = conn.execute(
                select(production_orders_table).where(production_orders_table.c.order_id == order_id)
            ).first()

            if not order:
                raise ValueError(f"Order {order_id} not found.")
            if order.status != "CREATED":
                raise ValueError(f"Order {order_id} is in invalid state {order.status} for start.")

            conn.execute(
                update(production_orders_table)
                .where(production_orders_table.c.order_id == order_id)
                .values(status="STARTED", start_date=timestamp)
            )

        audit_service.log_action(actor_id, actor_role, "PRODUCTION_STARTED", "PRODUCTION_ORDER", order_id)
        emit_event_sync(
            "PRODUCTION_STARTED",
            {"order_id": order_id, "status": "STARTED"},
        )
        return {"order_id": order_id, "status": "STARTED"}

    def submit_qa(
        self,
        order_id: str,
        passed: int,
        failed: int,
        defect_type: Optional[str],
        notes: Optional[str],
        actor_id: str,
        actor_role: str,
    ) -> Dict[str, Any]:
        inspection_id = self._generate_id("QA")
        timestamp = datetime.now(timezone.utc)

        if passed == 0:
            status = "FAILED"
        elif failed == 0:
            status = "PASSED"
        else:
            status = "PARTIALLY_PASSED"

        with _engine().begin() as conn:
            order = conn.execute(
                select(production_orders_table).where(production_orders_table.c.order_id == order_id)
            ).first()
            if not order:
                raise ValueError(f"Order {order_id} not found.")

            conn.execute(
                insert(quality_inspections_table).values(
                    inspection_id=inspection_id,
                    production_order_id=order_id,
                    inspector_id=actor_id,
                    quantity_inspected=passed + failed,
                    quantity_passed=passed,
                    quantity_failed=failed,
                    defect_type=defect_type,
                    notes=notes,
                    status=status,
                    created_at=timestamp,
                )
            )

            conn.execute(
                update(production_orders_table)
                .where(production_orders_table.c.order_id == order_id)
                .values(qa_status=status)
            )

        audit_service.log_action(
            actor_id,
            actor_role,
            f"QA_{status}",
            "PRODUCTION_ORDER",
            order_id,
            new_value={"passed": passed, "failed": failed},
        )

        event_type = "QA_FAILED" if status == "FAILED" else "QA_PASSED"
        notify_roles = ["admin", "manufacturer"] if status == "FAILED" else None
        severity = "critical" if status == "FAILED" else "info"

        emit_event_sync(
            event_type,
            {
                "inspection_id": inspection_id,
                "order_id": order_id,
                "status": status,
                "passed": passed,
                "failed": failed,
            },
            notify_roles=notify_roles,
            notify_severity=severity,
            notify_title=f"QA {status}",
            notify_message=f"QA for order {order_id} {status}.",
        )

        return {"inspection_id": inspection_id, "status": status}

    def complete_production(self, order_id: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)

        with _engine().begin() as conn:
            order = conn.execute(
                select(production_orders_table).where(production_orders_table.c.order_id == order_id)
            ).first()
            if not order:
                raise ValueError("Order not found.")
            if order.status != "STARTED":
                raise ValueError("Order is not running.")
            if order.qa_status not in ("PASSED", "PARTIALLY_PASSED"):
                raise ValueError("QA must be passed before completing production.")

            product = conn.execute(
                select(products_table).where(products_table.c.sku == order.sku)
            ).first()
            if not product:
                raise ValueError(f"Product {order.sku} not found.")

            prev_qty = product.quantity
            new_qty = prev_qty + order.quantity

            # Increment finished goods
            conn.execute(
                update(products_table)
                .where(products_table.c.sku == order.sku)
                .values(quantity=new_qty, available_stock=product.available_stock + order.quantity)
            )

            # Stock movement log — column is 'quantity' (not 'quantity_change')
            conn.execute(
                insert(stock_movements_table).values(
                    movement_id=self._generate_id("MOV"),
                    sku=order.sku,
                    movement_type="PRODUCTION_COMPLETED",
                    quantity=order.quantity,
                    previous_quantity=prev_qty,
                    new_quantity=new_qty,
                    reference_type="PRODUCTION_ORDER",
                    reference_id=order_id,
                    user_id=actor_id,
                    created_at=timestamp,
                )
            )

            # Update order status
            conn.execute(
                update(production_orders_table)
                .where(production_orders_table.c.order_id == order_id)
                .values(status="COMPLETED", end_date=timestamp)
            )

        audit_service.log_action(
            actor_id,
            actor_role,
            "PRODUCTION_COMPLETED",
            "PRODUCTION_ORDER",
            order_id,
            new_value={"quantity_added": order.quantity, "sku": order.sku},
        )
        emit_event_sync(
            "INVENTORY_UPDATED",
            {"sku": order.sku, "quantity_added": order.quantity, "production_order_id": order_id},
            notify_roles=["admin", "dealer"],
            notify_title="Inventory Updated",
            notify_message=f"Production completed: {order.quantity} units of {order.sku} added to inventory.",
        )
        return {"order_id": order_id, "status": "COMPLETED"}

    def dispatch_production(
        self,
        order_id: str,
        destination: str,
        actor_id: str,
        actor_role: str,
    ) -> Dict[str, Any]:
        """
        Dispatch a COMPLETED production order:
        1. Create a Waybill (correct signature: batch_id, sku, quantity, order_id, initial_custodian)
        2. Create a Shipment record
        3. Update production order with shipment_id
        """
        with _engine().begin() as conn:
            order = conn.execute(
                select(production_orders_table).where(production_orders_table.c.order_id == order_id)
            ).first()
            if not order or order.status != "COMPLETED":
                raise ValueError("Only COMPLETED production orders can be dispatched.")

        # Create Waybill with correct signature
        waybill = waybill_service.create_waybill(
            batch_id=order.batch_id,
            sku=order.sku,
            quantity=order.quantity,
            order_id=order.order_code or order_id,
            initial_custodian=actor_id,
            actor_id=actor_id,
            actor_role=actor_role,
        )

        # Create a Shipment record linked to this production
        timestamp = datetime.now(timezone.utc)
        shipment_id = f"SHP-{uuid.uuid4().hex[:8].upper()}"
        with _engine().begin() as conn:
            conn.execute(
                insert(shipments_table).values(
                    shipment_id=shipment_id,
                    order_code=order.order_code,
                    status="PENDING",
                    origin="Manufacturer Hub",
                    destination=destination,
                    timestamp=timestamp,
                )
            )
            # Link shipment back to production order if column exists
            try:
                conn.execute(
                    update(production_orders_table)
                    .where(production_orders_table.c.order_id == order_id)
                    .values(shipment_id=shipment_id)
                )
            except Exception:
                pass  # shipment_id column may not exist yet

        audit_service.log_action(
            actor_id,
            actor_role,
            "PRODUCTION_DISPATCHED",
            "PRODUCTION_ORDER",
            order_id,
            new_value={
                "waybill_id": waybill["waybill_id"],
                "shipment_id": shipment_id,
                "destination": destination,
            },
        )
        emit_event_sync(
            "SHIPMENT_CREATED",
            {
                "shipment_id": shipment_id,
                "waybill_id": waybill["waybill_id"],
                "order_id": order_id,
                "destination": destination,
            },
            notify_roles=["transporter", "dealer", "admin"],
            notify_title="Shipment Created",
            notify_message=f"Shipment {shipment_id} created for production order {order_id}.",
        )

        return {
            "waybill_id": waybill["waybill_id"],
            "shipment_id": shipment_id,
            "status": "DISPATCHED",
        }

    def report_issue(
        self,
        entity_type: str,
        entity_id: str,
        issue_type: str,
        severity: str,
        description: str,
        actor_id: str,
        actor_role: str,
    ) -> Dict[str, Any]:
        issue_id = self._generate_id("ISS")
        timestamp = datetime.now(timezone.utc)

        with _engine().begin() as conn:
            conn.execute(
                insert(issues_table).values(
                    issue_id=issue_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    issue_type=issue_type,
                    severity=severity,
                    description=description,
                    status="OPEN",
                    reporter_id=actor_id,
                    created_at=timestamp,
                )
            )

        audit_service.log_action(
            actor_id,
            actor_role,
            "ISSUE_REPORTED",
            entity_type,
            entity_id,
            new_value={"issue_id": issue_id, "type": issue_type},
        )
        return {"issue_id": issue_id, "status": "OPEN"}


manufacturer_service = ManufacturerService()
