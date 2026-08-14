from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.api.auth import get_current_payload, require_roles
from app.models.user import UserRole
from app.schemas.base import APIResponse
from app.services.inventory_service import inventory_service
from app.services.database_service import _engine, products_table, stock_movements_table
from sqlalchemy import select, desc

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
    
    audit_service.log_action(
        user=actor_id,
        role=payload.get("role", "retail_shop"),
        action="APPROVE_REORDER",
        entity="PRODUCT",
        entity_id=req.sku,
        new_value={"approved_quantity": req.quantity}
    )
    return APIResponse(success=True, data={"sku": req.sku, "status": "APPROVED"})
