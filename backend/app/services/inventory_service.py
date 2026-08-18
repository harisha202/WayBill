from __future__ import annotations
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, update, insert
from typing import Dict, Any

from app.services.database_service import (
    _engine, 
    products_table, 
    orders_table, 
    backorders_table, 
    stock_movements_table,
    discrepancies_table
)
from app.services.audit_service import audit_service
from app.services.domain_events import emit_event_sync

class InventoryService:
    @staticmethod
    def receive_order(
        order_code: str, 
        received_quantity: int, 
        actor_id: str, 
        actor_role: str
    ) -> Dict[str, Any]:
        """
        Transactional receive flow that automatically detects discrepancies,
        updates inventory, and creates backorders.
        """
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            # 1. Fetch the Order
            order = conn.execute(
                select(orders_table).where(orders_table.c.order_code == order_code)
            ).first()
            
            if not order:
                raise ValueError(f"Order {order_code} not found")
                
            sku = order.product_sku
            ordered_quantity = order.quantity if hasattr(order, 'quantity') else order.ordered_quantity # Check exact column
            
            # 2. Calculate Discrepancy
            discrepancy = ordered_quantity - received_quantity
            has_discrepancy = discrepancy > 0
            is_over_received = discrepancy < 0
            
            if is_over_received:
                raise ValueError("Over-receiving is not permitted without explicit dispute resolution.")
            
            # 3. Update Order
            conn.execute(
                update(orders_table)
                .where(orders_table.c.order_code == order_code)
                .values(
                    received_quantity=received_quantity,
                    # pending_quantity=discrepancy if has_discrepancy else 0, # Assuming column exists or we just rely on status
                    status="DELIVERED" if not has_discrepancy else "PARTIALLY_DELIVERED",
                    updated_at=timestamp
                )
            )
            
            # 4. Update Inventory & Record Stock Movement
            product = conn.execute(
                select(products_table).where(products_table.c.sku == sku)
            ).first()
            
            if product:
                prev_qty = product.available_stock
                new_in_transit = max(0, product.in_transit - ordered_quantity)
                new_available = prev_qty + received_quantity
                
                # Update product
                conn.execute(
                    update(products_table)
                    .where(products_table.c.sku == sku)
                    .values(
                        in_transit=new_in_transit,
                        available_stock=new_available
                    )
                )
                
                # Insert Stock Movement
                conn.execute(
                    insert(stock_movements_table).values(
                        movement_id=str(uuid.uuid4()),
                        sku=sku,
                        quantity=received_quantity,
                        movement_type="RECEIVE",
                        previous_quantity=prev_qty,
                        new_quantity=new_available,
                        reference_type="ORDER",
                        reference_id=order_code,
                        user_id=actor_id,
                        created_at=timestamp
                    )
                )
            
            # 5. Create Discrepancy & Backorder if necessary
            if has_discrepancy:
                conn.execute(
                    insert(discrepancies_table).values(
                        discrepancy_id=str(uuid.uuid4()),
                        order_id=order_code,
                        waybill_id=None, # Updated in waybill service if known
                        sku=sku,
                        ordered_quantity=ordered_quantity,
                        received_quantity=received_quantity,
                        missing_quantity=discrepancy,
                        reason="Missing at receipt",
                        status="OPEN",
                        created_at=timestamp
                    )
                )
                conn.execute(
                    insert(backorders_table).values(
                        order_id=order_code,
                        sku=sku,
                        missing_quantity=discrepancy,
                        status="OPEN",
                        created_at=timestamp
                    )
                )

        # 6. Audit Logging
        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="INVENTORY_RECEIVED",
            entity="ORDER",
            entity_id=order_code,
            old_value={"received": getattr(order, 'received_quantity', 0), "status": order.status},
            new_value={"received": received_quantity, "status": "DELIVERED" if not has_discrepancy else "PARTIALLY_DELIVERED"}
        )
        
        if has_discrepancy:
            audit_service.log_action(
                user=actor_id,
                role=actor_role,
                action="DISCREPANCY_CREATED",
                entity="ORDER",
                entity_id=order_code,
                new_value={"missing_quantity": discrepancy, "sku": sku}
            )

        emit_event_sync(
            "RECEIVING_COMPLETED",
            {"order_code": order_code, "received": received_quantity},
            notify_title="Receiving Completed",
            notify_message=f"Order {order_code} received {received_quantity} items."
        )

        if has_discrepancy:
            emit_event_sync(
                "DISCREPANCY_CREATED",
                {"order_code": order_code, "sku": sku, "missing_quantity": discrepancy},
                notify_roles=["dealer", "admin"],
                notify_severity="warning",
                notify_title="Discrepancy Detected",
                notify_message=f"Order {order_code} is missing {discrepancy} items of {sku}."
            )
            emit_event_sync(
                "BACKORDER_CREATED",
                {"order_code": order_code, "sku": sku, "missing_quantity": discrepancy}
            )

        return {
            "order_code": order_code,
            "ordered": ordered_quantity,
            "received": received_quantity,
            "discrepancy": discrepancy,
            "backorder_created": has_discrepancy
        }

    @staticmethod
    def process_retail_sale(
        sku: str,
        quantity: int,
        actor_id: str,
        actor_role: str
    ) -> Dict[str, Any]:
        """
        Transactional retail sale. Decrements inventory and logs stock movement.
        """
        timestamp = datetime.now(timezone.utc)
        sale_id = str(uuid.uuid4())
        
        with _engine().begin() as conn:
            product = conn.execute(
                select(products_table).where(products_table.c.sku == sku)
            ).first()
            
            if not product:
                raise ValueError("Product not found")
                
            prev_qty = product.available_stock
            
            if prev_qty < quantity:
                raise ValueError(f"Insufficient stock for {sku}. Requested: {quantity}, Available: {prev_qty}")
                
            new_qty = prev_qty - quantity
            
            # Update product
            conn.execute(
                update(products_table)
                .where(products_table.c.sku == sku)
                .values(available_stock=new_qty)
            )
            
            # Record Stock Movement
            conn.execute(
                insert(stock_movements_table).values(
                    movement_id=str(uuid.uuid4()),
                    sku=sku,
                    quantity=-quantity,
                    movement_type="SALE",
                    previous_quantity=prev_qty,
                    new_quantity=new_qty,
                    reference_type="SALE",
                    reference_id=sale_id,
                    user_id=actor_id,
                    created_at=timestamp
                )
            )
            
        # Audit Log
        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="RETAIL_SALE",
            entity="SALE",
            entity_id=sale_id,
            old_value={"available_stock": prev_qty},
            new_value={"available_stock": new_qty, "sold_quantity": quantity}
        )
        
        return {
            "sale_id": sale_id,
            "sku": sku,
            "quantity_sold": quantity,
            "remaining_stock": new_qty
        }

inventory_service = InventoryService()
