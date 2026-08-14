from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional

from app.core.middleware import require_roles
from app.models.user import UserRole
from app.services.manufacturer_service import manufacturer_service
from app.schemas.base import APIResponse
from app.services.database_service import _engine, production_orders_table, quality_inspections_table, issues_table, products_table, waybill_documents_table, suppliers_table, supplier_risk_scores_table, orders_table
from sqlalchemy import select

router = APIRouter(prefix="/manufacturer", tags=["manufacturer"])

class ProductionOrderRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)

class QAInspectionRequest(BaseModel):
    passed: int = Field(ge=0)
    failed: int = Field(ge=0)
    defect_type: Optional[str] = None
    notes: Optional[str] = None

class IssueReportRequest(BaseModel):
    entity_type: str
    entity_id: str
    issue_type: str
    severity: str
    description: str

class DispatchRequest(BaseModel):
    destination: str


@router.get("/overview", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_overview():
    with _engine().begin() as conn:
        orders = conn.execute(select(production_orders_table)).fetchall()
        total_orders = len(orders)
        active_orders = len([o for o in orders if o.status in ("STARTED", "CREATED")])
        completed_orders = len([o for o in orders if o.status == "COMPLETED"])
        
    return APIResponse(success=True, data={
        "total_orders": total_orders,
        "active_orders": active_orders,
        "completed_orders": completed_orders
    })

@router.get("/orders", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_orders():
    with _engine().begin() as conn:
        orders = conn.execute(select(production_orders_table)).fetchall()
        return APIResponse(success=True, data=[dict(o._mapping) for o in orders])

@router.get("/orders/{order_id}", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_order(order_id: str):
    with _engine().begin() as conn:
        order = conn.execute(select(production_orders_table).where(production_orders_table.c.order_id == order_id)).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return APIResponse(success=True, data=dict(order._mapping))

@router.post("/orders", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def create_production_order(data: ProductionOrderRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.create_production_order(data.sku, data.quantity, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/orders/{order_id}/start", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def start_production(order_id: str, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.start_production(order_id, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/orders/{order_id}/complete", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def complete_production(order_id: str, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.complete_production(order_id, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/quality", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_quality():
    with _engine().begin() as conn:
        qas = conn.execute(select(quality_inspections_table)).fetchall()
        return APIResponse(success=True, data=[dict(qa._mapping) for qa in qas])

@router.post("/orders/{order_id}/qa", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def submit_qa(order_id: str, data: QAInspectionRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.submit_qa(order_id, data.passed, data.failed, data.defect_type, data.notes, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/issues", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_issues():
    with _engine().begin() as conn:
        issues = conn.execute(select(issues_table)).fetchall()
        return APIResponse(success=True, data=[dict(iss._mapping) for iss in issues])

@router.post("/issues", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def report_issue(data: IssueReportRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.report_issue(data.entity_type, data.entity_id, data.issue_type, data.severity, data.description, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/inventory", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_inventory():
    with _engine().begin() as conn:
        prods = conn.execute(select(products_table)).fetchall()
        return APIResponse(success=True, data=[dict(p._mapping) for p in prods])

@router.get("/waybills", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_waybills():
    with _engine().begin() as conn:
        wbs = conn.execute(select(waybill_documents_table)).fetchall()
        return APIResponse(success=True, data=[dict(w._mapping) for w in wbs])

@router.post("/orders/{order_id}/dispatch", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def dispatch_production(order_id: str, data: DispatchRequest, payload: dict = Depends(require_roles(UserRole.admin, UserRole.manufacturer))):
    try:
        actor_id = payload.get("sub", "unknown")
        actor_role = payload.get("role", "unknown")
        res = manufacturer_service.dispatch_production(order_id, data.destination, actor_id, actor_role)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/demand", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_demand():
    with _engine().begin() as conn:
        orders = conn.execute(select(orders_table)).fetchall()
        # Just return all orders to simulate demand for the manufacturer
        return APIResponse(success=True, data=[dict(o._mapping) for o in orders])

@router.get("/suppliers", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_suppliers():
    with _engine().begin() as conn:
        sups = conn.execute(select(suppliers_table)).fetchall()
        # Join with risk scores for comprehensive view
        scores = conn.execute(select(supplier_risk_scores_table)).fetchall()
        scores_by_sup = {s.supplier_id: dict(s._mapping) for s in scores}
        
        results = []
        for sup in sups:
            data = dict(sup._mapping)
            data["risk_scores"] = scores_by_sup.get(data["supplier_id"], {})
            results.append(data)
            
        return APIResponse(success=True, data=results)
