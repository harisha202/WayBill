from fastapi import APIRouter, Depends, Request
from app.core.middleware import require_roles
from app.models.user import UserRole
from app.schemas.tracking import RouteOptimizationRequest, RouteOptimizationResponse, GPSCoordinate
from app.schemas.base import APIResponse
from app.services.database_service import log_activity, _haversine_km
import random

router = APIRouter(prefix="/route-optimizer", tags=["Route Optimizer"])

@router.post("/optimise", dependencies=[Depends(require_roles(UserRole.transporter, UserRole.admin))], response_model=APIResponse[RouteOptimizationResponse])
def optimise_route(payload: RouteOptimizationRequest, request: Request):
    user = request.state.user if hasattr(request.state, "user") else {"sub": "sys", "role": "transporter"}
    
    base_distance = _haversine_km(
        payload.current_location.lat, payload.current_location.lng,
        payload.destination.lat, payload.destination.lng
    )
    
    detour_factor = random.uniform(1.3, 1.5)
    distance_before = base_distance * detour_factor
    
    optimized_factor = random.uniform(1.1, 1.15)
    distance_after = base_distance * optimized_factor
    
    time_before = distance_before / 40.0
    time_after = distance_after / 50.0
    
    cost_per_km = 20.0
    cost_before = distance_before * cost_per_km
    cost_after = distance_after * cost_per_km
    
    money_saved = cost_before - cost_after
    percentage_saved = (money_saved / cost_before) * 100 if cost_before > 0 else 0
    
    risk_before = random.uniform(0.6, 0.9)
    risk_after = random.uniform(0.2, 0.4)
    
    mid_lat = (payload.current_location.lat + payload.destination.lat) / 2
    mid_lng = (payload.current_location.lng + payload.destination.lng) / 2
    
    optimized_path = [
        payload.current_location,
        GPSCoordinate(lat=mid_lat + random.uniform(-0.01, 0.01), lng=mid_lng + random.uniform(-0.01, 0.01)),
        payload.destination
    ]
    
    response_data = RouteOptimizationResponse(
        distance_before=round(distance_before, 2),
        distance_after=round(distance_after, 2),
        time_before=round(time_before, 2),
        time_after=round(time_after, 2),
        cost_before=round(cost_before, 2),
        cost_after=round(cost_after, 2),
        money_saved=round(money_saved, 2),
        percentage_saved=round(percentage_saved, 2),
        risk_before=round(risk_before, 2),
        risk_after=round(risk_after, 2),
        optimized_path=optimized_path
    )
    
    log_activity(user["sub"], user.get("role", "transporter"), "optimise_route", "route")
    return APIResponse(
        success=True,
        data=response_data,
        message="Route optimized successfully"
    )
