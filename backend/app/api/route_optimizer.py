from fastapi import APIRouter, Depends
from typing import Any
from app.core.middleware import require_roles
from app.models.user import UserRole
from fastapi import Request
from app.services.ai_service import optimise_delivery_route
from app.services.database_service import log_activity

router = APIRouter(prefix="/route-optimizer", tags=["Route Optimizer"])

@router.post("/optimise", dependencies=[Depends(require_roles(UserRole.transporter, UserRole.admin))])
def optimise_route(payload: dict, request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"sub": "sys", "role": "transporter"}
    warehouse = payload.get("warehouse", "Default HQ")
    stops = payload.get("stops", [])
    constraints = payload.get("constraints", {})
    
    result = optimise_delivery_route(warehouse, stops, constraints)
    log_activity(user["sub"], user.get("role", "transporter"), "optimise_route", "route")
    return result
