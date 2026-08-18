from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.schemas.inventory import OrderCreateRequest, ReceiptRequest
from app.schemas.base import APIResponse
from app.services.blockchain_service import generate_product_hash, generate_tx_hash
from app.services.database_service import (
    DatabaseError,
    DatabaseConflictError,
    append_pipeline_event,
    create_ledger_record,
    create_order,
    get_order,
    get_product_by_sku,
    format_inr,
    list_dealer_arrivals,
    list_orders,
    list_products,
    reorder_recommendations,
    update_order_stage,
    receive_order_with_discrepancy,
)
from app.services.ai_service import predict_low_stock
from app.core.config import get_settings
from app.services.notification_service import notification_service
from app.services.domain_events import emit_event_sync

router = APIRouter(prefix="/dealer", tags=["dealer"])


class DealerOrderForwardRequest(BaseModel):
    manufacturer_id: str = Field(default="manufacturer")


def _write_stage_event(order: dict, stage: str, payload: dict) -> str:
    tx_hash = generate_tx_hash(payload)
    ledger_hash = generate_product_hash(
        product_id=str(order.get("product_sku")),
        batch_id=str(order.get("batch_id") or "NA"),
        payload=payload,
    )
    create_ledger_record(
        product_id=str(order.get("product_sku")),
        batch_id=str(order.get("batch_id") or "NA"),
        event_stage=stage,
        payload=payload,
        ledger_hash=ledger_hash,
        tx_hash=tx_hash,
    )
    append_pipeline_event(
        order_code=str(order.get("order_code")),
        product_sku=str(order.get("product_sku")),
        stage=stage,
        tx_hash=tx_hash,
        payload=payload,
        shipment_id=order.get("shipment_id"),
    )
    return tx_hash


def _inventory_items() -> list[dict]:
    items: list[dict] = []
    for index, product in enumerate(list_products(), start=1):
        quantity = int(product.get("quantity", 0))
        min_stock = max(25, int(quantity * 0.3))
        max_stock = max(quantity, min_stock + 100)
        if quantity <= max(10, int(min_stock * 0.4)):
            stock_status = "Out of Stock" if quantity == 0 else "Low Stock"
        elif quantity <= min_stock:
            stock_status = "Low Stock"
        else:
            stock_status = "In Stock"

        category = (
            "Medicines"
            if "IV" in str(product.get("sku", ""))
            else "Surgical Supplies"
            if "KIT" in str(product.get("sku", ""))
            else "Medical Devices"
        )

        items.append(
            {
                "id": int(product.get("id", index)),
                "sku": product.get("sku", f"SKU-{index:03d}"),
                "productName": product.get("name", f"Product {index}"),
                "category": category,
                "manufacturer": "Global Supply Manufacturer",
                "currentStock": quantity,
                "minStock": min_stock,
                "maxStock": max_stock,
                "unitPrice": float(product.get("price", 0.0)),
                "stockStatus": stock_status,
                "lastRestocked": datetime.now(timezone.utc).date().isoformat(),
            }
        )
    return items


def _pipeline_rows(limit: int = 100) -> list[dict]:
    orders = list_orders(limit=limit)
    rows: list[dict] = []
    for order in orders:
        sku = str(order.get("product_sku"))
        product = get_product_by_sku(sku) or {}
        price = float(product.get("price") or 0.0)
        qty = int(order.get("quantity") or 0)
        created_at = order.get("created_at")
        rows.append(
            {
                "orderCode": order.get("order_code"),
                "retailer": order.get("retailer_name"),
                "retailerEmail": order.get("retailer_email"),
                "productSku": sku,
                "quantity": qty,
                "amount": round(price * qty, 2),
                "currentStage": order.get("current_stage"),
                "status": order.get("status"),
                "shipmentId": order.get("shipment_id"),
                "batchId": order.get("batch_id"),
                "manufacturerId": order.get("manufacturer_id"),
                "transporterId": order.get("transporter_id"),
                "origin": order.get("origin") or "Manufacturer Hub",
                "destination": order.get("destination") or "Dealer Warehouse",
                "createdAt": created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or ""),
            }
        )
    return rows


@router.post("/orders/retail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer, UserRole.retail_shop))], response_model=APIResponse[dict])
def create_retail_order(data: OrderCreateRequest) -> APIResponse[dict]:
    if get_product_by_sku(data.product_sku) is None:
        raise HTTPException(status_code=404, detail="Product SKU not found")

    try:
        order = create_order(
            retailer_name=data.retailer_name,
            retailer_email=data.retailer_email,
            dealer_id=data.dealer_id,
            product_sku=data.product_sku,
            quantity=data.quantity,
            origin=data.origin,
            destination=data.destination,
        )
        tx_hash = _write_stage_event(
            order,
            stage="retail_ordered",
            payload={
                "orderCode": order["order_code"],
                "retailer": data.retailer_name,
                "productSku": data.product_sku,
                "quantity": data.quantity,
            },
        )
    except DatabaseConflictError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    notification_service.publish(
        user_id="dealer",
        title="New retail order",
        message=f"{order['order_code']} placed by {data.retailer_name}.",
        metadata={"orderCode": order["order_code"], "txHash": tx_hash},
    )
    return APIResponse(success=True, data={"order": order, "txHash": tx_hash})


@router.patch("/orders/{order_code}/confirm", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def confirm_retail_order(order_code: str):
    order = get_order(order_code)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        updated = update_order_stage(order_code, stage="dealer_confirmed", status="dealer_confirmed")
        tx_hash = _write_stage_event(
            updated or order,
            stage="dealer_confirmed",
            payload={"orderCode": order_code, "confirmedBy": "dealer"},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    notification_service.publish(
        user_id="retail_shop",
        title="Order confirmed",
        message=f"{order_code} confirmed by dealer.",
        metadata={"orderCode": order_code, "txHash": tx_hash},
    )
    
    emit_event_sync(
        "ORDER_CONFIRMED",
        {"order_code": order_code},
        notify_users=["manufacturer"],
        notify_roles=["admin"],
        notify_title="Retail Order Confirmed",
        notify_message=f"Order {order_code} confirmed by dealer."
    )
    
    return {"order": updated, "txHash": tx_hash}


@router.patch("/orders/{order_code}/dealer-order", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def forward_order_to_manufacturer(order_code: str, data: DealerOrderForwardRequest):
    order = get_order(order_code)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        updated = update_order_stage(
            order_code,
            stage="dealer_ordered_manufacturer",
            status="dealer_ordered_manufacturer",
            manufacturer_id=data.manufacturer_id,
        )
        tx_hash = _write_stage_event(
            updated or order,
            stage="dealer_ordered_manufacturer",
            payload={"orderCode": order_code, "manufacturerId": data.manufacturer_id},
        )
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    notification_service.publish(
        user_id=data.manufacturer_id,
        title="Dealer order queued",
        message=f"{order_code} requires batch creation.",
        metadata={"orderCode": order_code, "txHash": tx_hash},
    )
    
    emit_event_sync(
        "ORDER_ACCEPTED",
        {"order_code": order_code, "manufacturer_id": data.manufacturer_id},
        notify_users=[data.manufacturer_id],
        notify_title="Order Accepted",
        notify_message=f"Order {order_code} assigned to {data.manufacturer_id}."
    )
    
    return {"order": updated, "txHash": tx_hash}


@router.patch("/orders/{order_code}/receive", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))], response_model=APIResponse[dict])
def receive_order(
    order_code: str, 
    data: ReceiptRequest,
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))
) -> APIResponse[dict]:
    actor_id = payload.get("sub", "unknown")
    actor_role = payload.get("role", "dealer")
    
    try:
        from app.services.inventory_service import inventory_service
        result = inventory_service.receive_order(
            order_code=order_code,
            received_quantity=data.received_quantity,
            actor_id=actor_id,
            actor_role=actor_role
        )
        
        # Optionally update Waybill Custody if associated
        from app.services.database_service import _engine, update_waybill_custody
        from sqlalchemy import select, Table, MetaData
        
        with _engine().begin() as conn:
            metadata = MetaData()
            waybill_table = Table("waybill_documents", metadata, autoload_with=conn)
            stmt = select(waybill_table).where(waybill_table.c.order_id == order_code)
            row = conn.execute(stmt).mappings().first()
            if row:
                update_waybill_custody(row["waybill_id"], actor_id, actor_role, "receive")

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    notification_service.publish(
        user_id="retail_shop",
        title="Order ready for retail",
        message=f"{order_code} received by dealer and ready for retail handoff.",
        metadata={"orderCode": order_code, "discrepancy": result.get("discrepancy", 0)}
    )
    
    return APIResponse(success=True, data=result, message="Order received successfully")


@router.patch("/orders/{order_code}/retail-receive", dependencies=[Depends(require_roles(UserRole.admin, UserRole.retail_shop, UserRole.dealer))])
def retail_receive(order_code: str):
    order = get_order(order_code)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        updated = update_order_stage(
            order_code,
            stage="retail_received",
            status="retail_received",
            retail_received=True,
        )
        tx_hash = _write_stage_event(
            updated or order,
            stage="retail_received",
            payload={"orderCode": order_code, "receivedBy": "retail_shop"},
        )
        
        # Update Waybill Custody to Retail
        from app.services.database_service import _engine, update_waybill_custody
        from sqlalchemy import select, Table, MetaData
        
        with _engine().begin() as conn:
            metadata = MetaData()
            waybill_table = Table("waybill_documents", metadata, autoload_with=conn)
            stmt = select(waybill_table).where(waybill_table.c.order_id == order_code)
            row = conn.execute(stmt).mappings().first()
            if row:
                update_waybill_custody(row["waybill_id"], "Retail Storefront", "Retailer", "verified")

    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return {"order": updated, "txHash": tx_hash}


@router.get("/orders/pipeline", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer, UserRole.manufacturer, UserRole.transporter, UserRole.retail_shop))])
def pipeline_orders(limit: int = Query(100, ge=1, le=500)):
    return {"items": _pipeline_rows(limit=limit)}


@router.get("/orders/recent", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def recent_orders():
    rows = _pipeline_rows(limit=20)
    orders = [
        {
            "orderId": item["orderCode"],
            "retailer": item["retailer"],
            "amount": format_inr(float(item["amount"]), decimals=2),
            "status": str(item["status"]).replace("_", " ").title(),
            "date": (item["createdAt"] or "")[:10],
            "shipmentId": item["shipmentId"],
            "currentStage": item["currentStage"],
        }
        for item in rows
    ]
    return {"orders": orders[:10]}


@router.get("/orders/trends", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def order_trends():
    rows = _pipeline_rows(limit=200)
    base = max(len(rows), 1) * 2
    trends = [max(0, base + ((index % 3) - 1) * 2 + (index // 2)) for index in range(7)]
    return {"trends": trends}


@router.get("/low-stock", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def low_stock_alerts():
    items = [item for item in _inventory_items() if item["stockStatus"] != "In Stock"]
    return {"items": items}


@router.get("/inventory", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def inventory():
    return {"items": _inventory_items()}


@router.get("/arrivals", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def arrivals():
    try:
        return {"shipments": list_dealer_arrivals()}
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/reorder-recommendations", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def ai_reorder_recommendations(days: int = Query(30, ge=7, le=120)):
    try:
        items = reorder_recommendations(days=days)
        api_key = get_settings().anthropic_api_key
        if api_key:
            items = predict_low_stock(items, api_key)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return {"items": items}


@router.get("/analytics", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def analytics(time_range: str = Query("30d", alias="range")):
    rows = _pipeline_rows(limit=500)
    delivered_count = sum(1 for item in rows if "deliver" in str(item.get("status")).lower() or "receive" in str(item.get("status")).lower())
    in_transit_count = sum(1 for item in rows if "transit" in str(item.get("status")).lower())
    pending_count = max(len(rows) - delivered_count - in_transit_count, 0)
    
    inventory_items = _inventory_items()

    # Simple zeroed array for revenue trend since we don't have historical real sales data table in dealer scope.
    # We will strictly avoid fake math.
    points = 7 if time_range == "7d" else 30
    revenue = [0.0] * points

    category_counts: dict[str, int] = {}
    for item in inventory_items:
        category = str(item.get("category") or "Other")
        category_counts[category] = category_counts.get(category, 0) + int(item.get("currentStock", 0))

    top_products = [
        {"label": category, "value": value, "color": color}
        for (category, value), color in zip(
            sorted(category_counts.items(), key=lambda kv: kv[1], reverse=True),
            ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#0ea5e9"],
        )
    ]

    return {
        "revenue": revenue,
        "topProducts": top_products,
        "orderStatus": [
            {"label": "Delivered/Received", "value": delivered_count, "color": "#22c55e"},
            {"label": "In Transit", "value": in_transit_count, "color": "#0ea5e9"},
            {"label": "Pending", "value": pending_count, "color": "#f59e0b"},
        ],
        "categoryMix": top_products,
    }


@router.get("/orders/backorders", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def backorders(limit: int = Query(100, ge=1, le=500)):
    from app.services.database_service import list_backorders
    return {"items": list_backorders(limit=limit)}

@router.get("/analytics/backorders")
def get_backorder_trend_v1(payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))):
    from app.services.database_service import get_backorder_trends
    data = get_backorder_trends()
    return APIResponse(success=True, data=data)

@router.get("/analytics/margin")
def get_margin(payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))):
    from app.services.database_service import get_profit_margins
    data = get_profit_margins()
    return APIResponse(success=True, data=data)


@router.patch("/disputes/{dispute_id}/resolve", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def resolve_dispute(dispute_id: str, payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))):
    from app.services.database_service import _engine
    from sqlalchemy import select, update, Table, MetaData
    from app.services.audit_service import audit_service
    
    actor_id = payload.get("sub", "unknown")
    actor_role = payload.get("role", "dealer")
    timestamp = datetime.now(timezone.utc)
    
    with _engine().begin() as conn:
        metadata = MetaData()
        disputes_table = Table("disputes", metadata, autoload_with=conn)
        dispute = conn.execute(select(disputes_table).where(disputes_table.c.dispute_id == dispute_id)).first()
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        if dispute.status == "RESOLVED":
            raise HTTPException(status_code=400, detail="Dispute already resolved")
            
        conn.execute(
            update(disputes_table)
            .where(disputes_table.c.dispute_id == dispute_id)
            .values(status="RESOLVED", resolved_at=timestamp)
        )
        
    audit_service.log_action(actor_id, actor_role, "DISPUTE_RESOLVED", "DISPUTE", dispute_id)
    
    emit_event_sync(
        "DISPUTE_RESOLVED",
        {"dispute_id": dispute_id, "status": "RESOLVED"},
        notify_roles=["admin", "dealer"],
        notify_title="Dispute Resolved",
        notify_message=f"Dispute {dispute_id} has been resolved."
    )
    
    return {"dispute_id": dispute_id, "status": "RESOLVED", "resolved_at": timestamp.isoformat()}


# ─── DEALER ANALYTICS ENDPOINTS ───────────────────────────────────────────────

@router.get("/reports/export", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def export_dealer_report(type: str = Query("orders", regex="^(orders|inventory|discrepancies)$")):
    from app.services.database_service import _engine, orders_table, products_table, discrepancies_table
    from sqlalchemy import select
    import csv, io
    from fastapi.responses import Response
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    with _engine().begin() as conn:
        if type == "orders":
            records = conn.execute(select(orders_table)).mappings().all()
        elif type == "inventory":
            records = conn.execute(select(products_table)).mappings().all()
        elif type == "discrepancies":
            records = conn.execute(select(discrepancies_table)).mappings().all()
        else:
            records = []
            
    if records:
        writer.writerow(records[0].keys())
        for row in records:
            writer.writerow(row.values())
    else:
        writer.writerow(["No data"])
        
    return Response(content=stream.getvalue().encode("utf-8"), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="dealer_{type}.csv"'})


@router.get("/analytics/dashboard", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_dashboard_analytics(days: int = Query(30, ge=7, le=365)):
    from app.services.database_service import (
        get_dealer_pipeline_funnel,
        get_dealer_order_volume_trend,
        get_dealer_order_value_scatter,
    )
    try:
        funnel = get_dealer_pipeline_funnel()
        volume_trend = get_dealer_order_volume_trend(days=days)
        value_scatter = get_dealer_order_value_scatter()
        rows = _pipeline_rows(limit=500)
        total = len(rows)
        delivered = sum(1 for r in rows if any(k in str(r.get("status", "")).lower() for k in ("receive", "deliver")))
        pending = sum(1 for r in rows if any(k in str(r.get("status", "")).lower() for k in ("pending", "retail_ordered")))
        inventory_items = _inventory_items()
        low_stock_count = sum(1 for i in inventory_items if i["stockStatus"] != "In Stock")
        return {
            "kpis": {
                "totalOrders": total,
                "deliveredOrders": delivered,
                "pendingOrders": pending,
                "lowStockProducts": low_stock_count,
            },
            "pipelineFunnel": funnel,
            "volumeTrend": volume_trend,
            "valueScatter": value_scatter,
        }
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/inventory-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_inventory_analytics(days: int = Query(30, ge=7, le=365)):
    from app.services.database_service import get_dealer_stock_movements_summary
    try:
        return get_dealer_stock_movements_summary(days=days)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/fulfillment-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_fulfillment_analytics(days: int = Query(30, ge=7, le=365)):
    from app.services.database_service import get_dealer_fulfillment_analytics
    try:
        return get_dealer_fulfillment_analytics(days=days)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/partners-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_partner_analytics():
    from app.services.database_service import get_dealer_partner_analytics
    try:
        return get_dealer_partner_analytics()
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/financial-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_financial_analytics(days: int = Query(90, ge=7, le=365)):
    from app.services.database_service import get_dealer_financial_analytics
    try:
        return get_dealer_financial_analytics(days=days)
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/alerts-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_alerts_analytics():
    from app.services.database_service import get_dealer_alerts_analytics
    try:
        return get_dealer_alerts_analytics()
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/disputes-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_disputes_analytics():
    from app.services.database_service import get_dealer_disputes_analytics
    try:
        return get_dealer_disputes_analytics()
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc


@router.get("/analytics/batches-detail", dependencies=[Depends(require_roles(UserRole.admin, UserRole.dealer))])
def dealer_batch_analytics():
    from app.services.database_service import get_dealer_batch_analytics
    try:
        return get_dealer_batch_analytics()
    except DatabaseError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

