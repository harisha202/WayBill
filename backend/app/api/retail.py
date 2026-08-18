from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.api.auth import get_current_payload, require_roles
from app.models.user import UserRole
from app.schemas.base import APIResponse
from app.services.inventory_service import inventory_service
from app.services.database_service import _engine, products_table, stock_movements_table, create_order, reorder_events_table, get_product_by_sku
from sqlalchemy import select, desc, insert
from app.services.domain_events import emit_event_sync
from datetime import datetime, timezone

router = APIRouter(prefix="/retail", tags=["retail"])

class SaleRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)
    idempotency_key: str = None

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
    # Logic: if available_stock <= reorder_point
    with _engine().begin() as conn:
        items = conn.execute(
            select(products_table)
            .where(products_table.c.available_stock <= products_table.c.reorder_point)
        ).mappings().all()
        
    recs = []
    for item in items:
        diff = item["reorder_point"] - item["available_stock"]
        recommended_qty = max(diff + 100, 100) # Simple logic to suggest enough to clear the threshold
        recs.append({
            "sku": item["sku"],
            "name": item["name"],
            "current_stock": item["available_stock"],
            "reorder_point": item["reorder_point"],
            "recommended_qty": recommended_qty,
            "reason": "Stock fell below reorder point"
        })
        
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
        
    order = create_order(
        retailer_name=retailer_name,
        retailer_email=retailer_email,
        dealer_id="dealer",
        product_sku=req.sku,
        quantity=req.quantity,
        origin="Retail Reorder",
        destination="Dealer Warehouse"
    )
    
    with _engine().begin() as conn:
        res = conn.execute(
            insert(reorder_events_table).values(
                sku=req.sku,
                recommended_quantity=req.quantity,
                justification="Retailer approved reorder",
                status="APPROVED",
                created_at=datetime.now(timezone.utc)
            )
        )
        reorder_event_id = res.lastrowid

    audit_service.log_action(
        user=actor_id,
        role=payload.get("role", "retail_shop"),
        action="APPROVE_REORDER",
        entity="PRODUCT",
        entity_id=req.sku,
        new_value={"approved_quantity": req.quantity, "order_code": order["order_code"]}
    )
    
    emit_event_sync(
        "REORDER_CREATED",
        {"order_code": order["order_code"], "sku": req.sku, "quantity": req.quantity},
        notify_users=["dealer"],
        notify_roles=["admin"],
        notify_title="Reorder Approved",
        notify_message=f"Reorder approved for {req.quantity} of {req.sku}."
    )
    
    return APIResponse(success=True, data={"sku": req.sku, "status": "APPROVED", "order_code": order["order_code"], "reorder_event_id": reorder_event_id})

# ─── RETAIL ANALYTICS ENDPOINTS ───────────────────────────────────────────────────

from app.services.database_service import (
    get_retail_dashboard_overview,
    get_retail_sales_pos_analytics,
    get_retail_inventory_analytics,
    get_retail_replenishment_analytics,
    get_retail_waybill_shipments,
    get_retail_qr_traceability,
    get_retail_receiving_analytics,
    get_retail_alerts_rag,
    get_retail_reports_analytics
)

@router.get("/reports/export", dependencies=[Depends(require_roles(UserRole.admin, UserRole.retail_shop))])
def export_retail_report(type: str = Query("sales", regex="^(sales|inventory|reorders)$")):
    from app.services.database_service import _engine, stock_movements_table, products_table, reorder_events_table
    from sqlalchemy import select
    import csv, io
    from fastapi.responses import Response
    
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
