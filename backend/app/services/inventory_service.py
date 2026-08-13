from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import select, update, insert
from typing import Dict, Any

from app.services.database_service import _engine, products_table, orders_table, backorders_table, activity_logs_table
from app.services.audit_service import audit_service

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
            ordered_quantity = order.ordered_quantity
            
            # 2. Calculate Discrepancy
            discrepancy = ordered_quantity - received_quantity
            has_discrepancy = discrepancy > 0
            
            # 3. Update Order
            conn.execute(
                update(orders_table)
                .where(orders_table.c.order_code == order_code)
                .values(
                    received_quantity=received_quantity,
                    discrepancy_quantity=discrepancy if has_discrepancy else 0,
                    discrepancy_status="DETECTED" if has_discrepancy else "NONE",
                    status="DELIVERED" if not has_discrepancy else "PARTIALLY_DELIVERED",
                    updated_at=timestamp
                )
            )
            
            # 4. Update Inventory
            # Decrease in_transit, increase available_stock
            product = conn.execute(
                select(products_table).where(products_table.c.sku == sku)
            ).first()
            
            if product:
                new_in_transit = max(0, product.in_transit - ordered_quantity)
                new_available = product.available_stock + received_quantity
                new_backordered = product.backordered + (discrepancy if has_discrepancy else 0)
                
                conn.execute(
                    update(products_table)
                    .where(products_table.c.sku == sku)
                    .values(
                        in_transit=new_in_transit,
                        available_stock=new_available,
                        backordered=new_backordered
                    )
                )
            
            # 5. Create Backorder if discrepancy
            if has_discrepancy:
                conn.execute(
                    insert(backorders_table).values(
                        order_id=order_code,
                        sku=sku,
                        missing_quantity=discrepancy,
                        status="OPEN",
                        created_at=timestamp
                    )
                )

        # 6. Audit Logging (Outside the transaction block but succeeds if transaction commits)
        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="INVENTORY_RECEIVED",
            entity="ORDER",
            entity_id=order_code,
            old_value={"received": order.received_quantity, "status": order.status},
            new_value={"received": received_quantity, "status": "DELIVERED" if not has_discrepancy else "PARTIALLY_DELIVERED"}
        )
        
        if has_discrepancy:
            audit_service.log_action(
                user=actor_id,
                role=actor_role,
                action="BACKORDER_CREATED",
                entity="ORDER",
                entity_id=order_code,
                new_value={"missing_quantity": discrepancy, "sku": sku}
            )

        return {
            "order_code": order_code,
            "ordered": ordered_quantity,
            "received": received_quantity,
            "discrepancy": discrepancy,
            "backorder_created": has_discrepancy
        }

inventory_service = InventoryService()
