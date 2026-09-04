from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Dict, Any
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
    retailer_name = payload.get("username", "retail")
    retailer_email = payload.get("email", "")
    
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
