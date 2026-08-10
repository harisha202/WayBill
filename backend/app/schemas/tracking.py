from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.base import IdempotentRequest

class GPSCoordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class GPSPingRequest(IdempotentRequest):
    shipment_id: str
    vehicle_id: Optional[str] = None
    location: GPSCoordinate
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None

class RouteOptimizationRequest(IdempotentRequest):
    shipment_id: str
    current_location: GPSCoordinate
    destination: GPSCoordinate
    
class RouteOptimizationResponse(BaseModel):
    distance_before: float
    distance_after: float
    time_before: float
    time_after: float
    cost_before: float
    cost_after: float
    money_saved: float
    percentage_saved: float
    risk_before: float
    risk_after: float
    optimized_path: List[GPSCoordinate]

class ShipmentEventSchema(BaseModel):
    id: int
    shipment_id: str
    event_type: str
    actor_id: str
    location: Optional[str]
    metadata: dict = Field(default_factory=dict)
    timestamp: datetime
