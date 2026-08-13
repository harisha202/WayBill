from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GPSCoordinate(BaseModel):
    lat: float
    lng: float

class Shipment(BaseModel):
    id: int
    shipment_id: str
    order_code: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    eta: Optional[str] = None
    weight: Optional[float] = None
    vehicle_number: Optional[str] = None
    assignment_status: Optional[str] = None
    delay_risk_score: Optional[float] = None
    predicted_delay_minutes: Optional[int] = None
    planned_eta: Optional[str] = None
    route_deviation: Optional[str] = None
    last_gps_at: Optional[datetime] = None
    risk_updated_at: Optional[datetime] = None
    timestamp: datetime
