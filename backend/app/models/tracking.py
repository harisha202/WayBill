from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Vehicle(BaseModel):
    id: str
    plate: str
    capacity_tons: float
    current_load_percent: float = 0.0
    status: str = "AVAILABLE"
    maintenance_status: str = "GOOD"

class Driver(BaseModel):
    id: str
    name: str
    license_number: str
    performance_score: float = 100.0
    on_time_percent: float = 100.0

class RoutePoint(BaseModel):
    lat: float
    lng: float
    order: int

class Route(BaseModel):
    id: str
    origin: str
    destination: str
    planned_distance_km: float
    points: List[RoutePoint]

class GPSEvent(BaseModel):
    vehicle_id: str
    shipment_id: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    timestamp: datetime
    accuracy: float = 1.0

class GPSHistory(GPSEvent):
    created_at: datetime = Field(default_factory=datetime.utcnow)
