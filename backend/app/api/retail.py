from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.api.auth import get_current_payload, require_roles
from app.models.user import UserRole
from app.schemas.base import APIResponse
from app.services.inventory_service import inventory_service
from app.services.database_service import (
    _engine,
    products_table,
    stock_movements_table,
    orders_table,
    create_order,
    reorder_events_table,
    get_product_by_sku,
    reorder_recommendations,
    record_sale,
    get_retail_dashboard_overview,
    get_retail_sales_pos_analytics,
    get_retail_inventory_analytics,
    get_retail_replenishment_analytics,
    get_retail_waybill_shipments,
    get_retail_qr_traceability,
    get_retail_receiving_analytics,
    get_retail_alerts_rag,
    get_retail_reports_analytics,
    _next_order_code,
)

from sqlalchemy import select, desc, insert, func
from app.services.domain_events import emit_event_sync
from datetime import datetime, timezone
import csv, io, threading
from fastapi.responses import Response

router = APIRouter(prefix="/retail", tags=["retail"])
_reorder_lock = threading.Lock()


class SaleRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)
    idempotency_key: str = None

class ReorderRejectRequest(BaseModel):
    sku: str
    reason: str = "Retailer rejected reorder recommendation"

class RetailReceiveRequest(BaseModel):
    received_quantity: int = Field(gt=0)
    notes: Optional[str] = None

@router.get("/inventory", response_model=APIResponse[List[Dict[str, Any]]])
def get_retail_inventory(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    with _engine().begin() as conn:
        items = conn.execute(select(products_table)).mappings().all()
    return APIResponse(success=True, data=[dict(i) for i in items])

@router.post("/sales", response_model=APIResponse[Dict[str, Any]])
def process_sale(
    req: SaleRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    actor_id = payload.get("sub", "unknown")
    actor_role = payload.get("role", "retail_shop")
    
    try:
        result = inventory_service.process_retail_sale(
            sku=req.sku,
            quantity=req.quantity,
            actor_id=actor_id,
            actor_role=actor_role
        )
        product = get_product_by_sku(req.sku) or {}
        record_sale(
            sku=req.sku,
            units_sold=req.quantity,
            sale_amount=round(float(product.get("price") or 0.0) * req.quantity, 2),
            retailer_name=payload.get("username", "retail"),
        )
        emit_event_sync(
            "STOCK_UPDATED",
            {"sku": req.sku, "quantity_change": -req.quantity, "reason": "retail_sale"},
            notify_roles=["retail_shop", "dealer"],
            notify_title="Stock Updated",
            notify_message=f"Sold {req.quantity} of {req.sku}."
        )
        return APIResponse(success=True, data=result, message="Sale processed successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during sale processing")

@router.get("/stock-movements", response_model=APIResponse[List[Dict[str, Any]]])
def get_stock_movements(
    sku: str = None,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    with _engine().begin() as conn:
        stmt = select(stock_movements_table).order_by(desc(stock_movements_table.c.created_at)).limit(50)
        if sku:
            stmt = stmt.where(stock_movements_table.c.sku == sku)
        items = conn.execute(stmt).mappings().all()
    return APIResponse(success=True, data=[dict(i) for i in items])

@router.get("/reorder/recommendations", response_model=APIResponse[List[Dict[str, Any]]])
def get_reorder_recommendations(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    with _engine().connect() as conn:
        active_reorder_skus = {
            str(r[0])
            for r in conn.execute(
                select(reorder_events_table.c.sku).where(
                    reorder_events_table.c.status == "APPROVED"
                )
            ).fetchall()
        }

    recs = [
        {
            "sku": item["sku"],
            "name": item.get("productName"),
            "current_stock": item.get("currentStock"),
            "reorder_point": item.get("reorderPoint"),
            "recommended_qty": max(
                1,
                int(
                    round(
                        max(
                            (float(item.get("avgDailySales") or 0.0) * int(item.get("leadTimeDays") or 0))
                            + int(item.get("safetyStock") or 0),
                            int(item.get("reorderPoint") or 0) + int(item.get("safetyStock") or 0),
                        )
                        - int(item.get("currentStock") or 0)
                    )
                ),
            ),
            "reason": item.get("recommendation"),
            "priority": item.get("priority"),
            "avg_daily_sales": item.get("avgDailySales"),
            "stock_out_days": item.get("stockOutDays"),
        }
        for item in reorder_recommendations(days=30)
        if item.get("priority") in ("critical", "high") and item.get("sku") not in active_reorder_skus
    ]

        
    if recs:
        from app.services.ai_service import predict_low_stock
        from app.core.config import get_settings
        api_key = get_settings().anthropic_api_key
        if api_key:
            recs = predict_low_stock(recs, api_key)
            
        emit_event_sync(
            "REORDER_RECOMMENDED",
            {"recommendations": recs},
            notify_roles=["retail_shop", "dealer"],
            notify_title="Reorder Recommendations",
            notify_message=f"{len(recs)} items dropped below reorder point."
        )
        
    return APIResponse(success=True, data=recs)

@router.post("/reorder/approve", response_model=APIResponse[Dict[str, Any]])
def approve_reorder(
    req: SaleRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    from app.services.audit_service import audit_service
    actor_id = payload.get("sub", "unknown")
    retailer_name = payload.get("company_name") or payload.get("username") or payload.get("sub", "Retail Shop")
    retailer_email = payload.get("sub") or payload.get("email", "")
    
    product = get_product_by_sku(req.sku)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    with _reorder_lock:
        with _engine().begin() as conn:
            pending_reorder = conn.execute(
                select(reorder_events_table).where(
                    reorder_events_table.c.sku == req.sku,
                    reorder_events_table.c.status == "APPROVED",
                    reorder_events_table.c.order_id.is_not(None),
                )
            ).mappings().first()
            if pending_reorder:
                raise HTTPException(status_code=409, detail="An approved reorder already exists for this product")
            
            now = datetime.now(timezone.utc)
            order_code = _next_order_code(conn)
            conn.execute(
                orders_table.insert().values(
                    order_code=order_code,
                    retailer_name=retailer_name,
                    retailer_email=retailer_email,
                    dealer_id="dealer",
                    product_sku=req.sku,
                    quantity=int(req.quantity),
                    status="retail_ordered",
                    current_stage="retail_ordered",
                    origin="Retail Reorder",
                    destination="Dealer Warehouse",
                    ordered_quantity=int(req.quantity),
                    created_at=now,
                    updated_at=now,
                )
            )
            
            res = conn.execute(
                insert(reorder_events_table).values(
                    sku=req.sku,
                    recommended_quantity=req.quantity,
                    justification="Retailer approved reorder",
                    status="APPROVED",
                    order_id=order_code,
                    created_at=now
                )
            )
            reorder_event_id = res.lastrowid




    audit_service.log_action(
        user=actor_id,
        role=payload.get("role", "retail_shop"),
        action="APPROVE_REORDER",
        entity="PRODUCT",
        entity_id=req.sku,
        new_value={"approved_quantity": req.quantity, "order_code": order_code}
    )
    
    emit_event_sync(
        "REORDER_CREATED",
        {"order_code": order_code, "sku": req.sku, "quantity": req.quantity},
        notify_users=["dealer"],
        notify_roles=["admin"],
        notify_title="Reorder Approved",
        notify_message=f"Reorder approved for {req.quantity} of {req.sku}."
    )
    
    return APIResponse(success=True, data={"sku": req.sku, "status": "APPROVED", "order_code": order_code, "reorder_event_id": reorder_event_id})


@router.post("/reorder/reject", response_model=APIResponse[Dict[str, Any]])
def reject_reorder(
    req: ReorderRejectRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    from app.services.audit_service import audit_service
    actor_id = payload.get("sub", "unknown")
    product = get_product_by_sku(req.sku)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    with _engine().begin() as conn:
        res = conn.execute(
            insert(reorder_events_table).values(
                sku=req.sku,
                recommended_quantity=0,
                justification=req.reason,
                status="REJECTED",
                order_id=None,
                created_at=datetime.now(timezone.utc)
            )
        )
        reorder_event_id = res.lastrowid

    audit_service.log_action(
        user=actor_id,
        role=payload.get("role", "retail_shop"),
        action="REJECT_REORDER",
        entity="PRODUCT",
        entity_id=req.sku,
        new_value={"reason": req.reason}
    )

    emit_event_sync(
        "REORDER_REJECTED",
        {"sku": req.sku, "reason": req.reason},
        notify_roles=["admin"],
        notify_title="Reorder Rejected",
        notify_message=f"Reorder recommendation rejected for {req.sku}."
    )

    return APIResponse(success=True, data={"sku": req.sku, "status": "REJECTED", "reorder_event_id": reorder_event_id})

# ─── RETAIL ANALYTICS ENDPOINTS ───────────────────────────────────────────────────

@router.get("/reports/export", dependencies=[Depends(require_roles(UserRole.admin, UserRole.retail_shop))])
def export_retail_report(type: str = Query("sales", pattern="^(sales|inventory|reorders)$")):
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    with _engine().begin() as conn:
        if type == "sales":
            records = conn.execute(select(stock_movements_table).where(stock_movements_table.c.movement_type == "SALE")).mappings().all()
        elif type == "inventory":
            records = conn.execute(select(products_table)).mappings().all()
        elif type == "reorders":
            records = conn.execute(select(reorder_events_table)).mappings().all()
        else:
            records = []
            
    if records:
        writer.writerow(records[0].keys())
        for row in records:
            writer.writerow(row.values())
    else:
        writer.writerow(["No data"])
        
    return Response(content=stream.getvalue().encode("utf-8"), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="retail_{type}.csv"'})

@router.get("/analytics/dashboard")
def api_retail_dashboard(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_dashboard_overview(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/sales")
def api_retail_sales(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 180
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_sales_pos_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/inventory-detail")
def api_retail_inventory_analytics(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_inventory_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/replenishment")
def api_retail_replenishment(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_replenishment_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/waybills")
def api_retail_waybills(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_waybill_shipments(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/traceability")
def api_retail_traceability(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_qr_traceability(retailer)
    return APIResponse(success=True, data=data)

@router.get("/analytics/receiving")
def api_retail_receiving(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_receiving_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/alerts")
def api_retail_alerts(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_alerts_rag(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/reports")
def api_retail_reports(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 180
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_reports_analytics(retailer, days)
    return APIResponse(success=True, data=data)


@router.get("/shipments", dependencies=[Depends(require_roles(UserRole.admin, UserRole.retail_shop))])
def get_retail_shipments(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    """Returns active inbound shipments and waybills associated with the retailer."""
    from app.services.database_service import shipments_table, waybill_documents_table
    with _engine().begin() as conn:
        role = payload.get("role")
        user_email = payload.get("sub")
        comp = payload.get("company_name")
        
        stmt = select(orders_table).order_by(desc(orders_table.c.id)).limit(100)
        orders = conn.execute(stmt).mappings().all()
        
        # Collect waybills and shipments
        wb_rows = conn.execute(select(waybill_documents_table)).mappings().all()
        wb_by_order = {w["order_id"]: dict(w) for w in wb_rows if w["order_id"]}
        
        shp_rows = conn.execute(select(shipments_table)).mappings().all()
        shp_by_code = {s["order_code"]: dict(s) for s in shp_rows if s["order_code"]}
        shp_by_id = {s["shipment_id"]: dict(s) for s in shp_rows if s["shipment_id"]}

        results = []
        for o in orders:
            o_dict = dict(o)
            ocode = o_dict.get("order_code")
            wb = wb_by_order.get(ocode) or {}
            shp = shp_by_code.get(ocode) or shp_by_id.get(o_dict.get("shipment_id")) or {}
            
            results.append({
                "order_code": ocode,
                "product_sku": o_dict.get("product_sku"),
                "quantity": o_dict.get("quantity"),
                "status": o_dict.get("status"),
                "current_stage": o_dict.get("current_stage"),
                "batch_id": o_dict.get("batch_id") or wb.get("batch_id"),
                "waybill_id": wb.get("waybill_id") or o_dict.get("waybill_id"),
                "shipment_id": shp.get("shipment_id") or o_dict.get("shipment_id"),
                "seal_hash": wb.get("seal_hash"),
                "carrier_vehicle": shp.get("vehicle_number"),
                "origin": shp.get("origin") or o_dict.get("origin") or "Manufacturer Hub",
                "destination": shp.get("destination") or o_dict.get("destination") or "Retail Store",
                "received_quantity": o_dict.get("received_quantity") or 0,
                "discrepancy_quantity": o_dict.get("discrepancy_quantity") or 0,
                "created_at": o_dict.get("created_at").isoformat() if hasattr(o_dict.get("created_at"), "isoformat") else str(o_dict.get("created_at") or "")
            })
            
        return APIResponse(success=True, data=results)


@router.post("/orders/{order_code}/receive", dependencies=[Depends(require_roles(UserRole.admin, UserRole.retail_shop))])
def receive_retail_order(
    order_code: str,
    data: RetailReceiveRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    """Processes retailer physical receipt of cargo, reconciling quantities, updating stock & ledger."""
    from app.services.database_service import (
        waybill_documents_table, discrepancies_table, backorders_table,
        update_waybill_custody, update_order_stage
    )
    from app.services.audit_service import audit_service
    import uuid

    actor_id = payload.get("sub", "retail")
    actor_role = payload.get("role", "retail_shop")
    now = datetime.now(timezone.utc)

    with _engine().begin() as conn:
        order = conn.execute(
            select(orders_table).where(orders_table.c.order_code == order_code)
        ).mappings().first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.get("current_stage") == "retail_received":
            raise HTTPException(status_code=400, detail="Order is already received by retail shop")

        ordered_qty = int(order.get("quantity") or 0)
        received_qty = int(data.received_quantity)
        missing_qty = max(0, ordered_qty - received_qty)
        has_discrepancy = missing_qty > 0

        # 1. Update Order stage and received count
        conn.execute(
            update(orders_table)
            .where(orders_table.c.order_code == order_code)
            .values(
                current_stage="retail_received",
                status="retail_received",
                received_quantity=received_qty,
                discrepancy_quantity=missing_qty,
                discrepancy_status="OPEN" if has_discrepancy else None,
                retail_received_at=now,
                updated_at=now
            )
        )

        # 2. Update Product Inventory (shelf stock increments by received_qty)
        sku = order.get("product_sku")
        prod = conn.execute(
            select(products_table).where(products_table.c.sku == sku)
        ).mappings().first()

        if prod:
            prev_avail = int(prod.get("available_stock") or 0)
            new_avail = prev_avail + received_qty
            conn.execute(
                update(products_table)
                .where(products_table.c.sku == sku)
                .values(available_stock=new_avail, quantity=new_avail)
            )

            # Insert stock movement
            conn.execute(
                insert(stock_movements_table).values(
                    movement_id=str(uuid.uuid4()),
                    sku=sku,
                    quantity=received_qty,
                    movement_type="RECEIVE_RETAIL",
                    previous_quantity=prev_avail,
                    new_quantity=new_avail,
                    reference_type="RETAIL_ORDER",
                    reference_id=order_code,
                    user_id=actor_id,
                    created_at=now
                )
            )

        # 3. Log Discrepancy & Backorder if shortage occurred
        if has_discrepancy:
            conn.execute(
                insert(discrepancies_table).values(
                    discrepancy_id=str(uuid.uuid4()),
                    order_id=order_code,
                    waybill_id=order.get("batch_id"),
                    sku=sku,
                    ordered_quantity=ordered_qty,
                    received_quantity=received_qty,
                    missing_quantity=missing_qty,
                    reason=data.notes or "Retail short delivery detected at store receiving",
                    status="OPEN",
                    created_at=now
                )
            )
            conn.execute(
                insert(backorders_table).values(
                    order_id=order_code,
                    sku=sku,
                    missing_quantity=missing_qty,
                    status="OPEN",
                    created_at=now
                )
            )

        # 4. Update Waybill Custody to Retailer
        wb = conn.execute(
            select(waybill_documents_table).where(waybill_documents_table.c.order_id == order_code)
        ).mappings().first()
        if wb:
            update_waybill_custody(
                wb["waybill_id"],
                actor_id,
                actor_id,
                actor_role,
                received_qty,
                "Retail Store Warehouse",
                "RECEIVE"
            )

    # 5. Financial Ledger Transaction
    from app.services.ledger_service import LedgerService
    unit_price = float((prod or {}).get("price") or 100.0)
    total_val = round(received_qty * unit_price, 2)
    LedgerService.create_transaction(
        entity_type="ORDER",
        entity_id=order_code,
        transaction_type="RETAIL_DELIVERY_CONFIRMED",
        amount=total_val,
        currency="INR",
        exchange_rate=1.0
    )

    # 6. Audit & Domain Event
    audit_service.log_action(
        user=actor_id,
        role=actor_role,
        action="RETAIL_STOCK_RECEIVED",
        entity="ORDER",
        entity_id=order_code,
        new_value={"received_qty": received_qty, "missing_qty": missing_qty}
    )

    emit_event_sync(
        "RETAIL_RECEIVED",
        {"order_code": order_code, "received_qty": received_qty, "sku": sku},
        notify_roles=["dealer", "admin"],
        notify_title="Retail Stock Received",
        notify_message=f"Store confirmed receipt of {received_qty} units for order {order_code}."
    )

    return APIResponse(
        success=True,
        data={
            "order_code": order_code,
            "ordered_quantity": ordered_qty,
            "received_quantity": received_qty,
            "missing_quantity": missing_qty,
            "status": "retail_received"
        },
        message="Stock successfully received and added to store shelf inventory"
    )
