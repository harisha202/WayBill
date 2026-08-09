from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from app.core.middleware import require_roles
from app.models.user import UserRole
from fastapi import Request
from app.services.database_service import get_supplier_tree, log_activity
from app.services.ai_service import analyse_supplier_risk

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("/tier-tree", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_tier_tree(request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"sub": "sys", "role": "admin"}
    tree = get_supplier_tree()
    log_activity(user["sub"], user.get("role", "admin"), "view_supplier_tree", "supplier")
    return {"data": tree}


@router.post("/{supplier_name}/risk", dependencies=[Depends(require_roles(UserRole.admin, UserRole.manufacturer))])
def get_supplier_risk(supplier_name: str, payload: dict, request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"sub": "sys", "role": "admin"}
    supplier_data = payload.get("supplier_data", {})
    news_snippets = payload.get("news_snippets", [])
    risk = analyse_supplier_risk(supplier_name, supplier_data, news_snippets)
    log_activity(user["sub"], user.get("role", "admin"), "analyse_supplier_risk", "supplier", supplier_name)
    return risk
