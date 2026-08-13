from __future__ import annotations
from datetime import datetime, timezone
import math
from sqlalchemy import insert, select, update
from typing import Dict, Any, List

from app.services.database_service import _engine, shipments_table, trucks_table, drivers_table, waybill_documents_table
from app.services.audit_service import audit_service

class TrackingService:
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # Haversine formula
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def ingest_gps_ping(
        shipment_id: str, 
        lat: float, 
        lng: float, 
        speed: float, 
        heading: float,
        actor_id: str,
        actor_role: str
    ) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            shipment = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            
            if not shipment:
                raise ValueError("Shipment not found")
                
            # Simulated Risk Calculation (e.g., speed > 90 = high risk, deviation = medium risk)
            risk_score = 0.0
            if speed > 90:
                risk_score += 25.0
            
            # Simple route deviation calculation if we had a planned route
            route_deviation = "LOW"
            if risk_score > 20:
                route_deviation = "HIGH"
                
            conn.execute(
                update(shipments_table)
                .where(shipments_table.c.shipment_id == shipment_id)
                .values(
                    lat=lat,
                    lng=lng,
                    delay_risk_score=risk_score,
                    route_deviation=route_deviation,
                    last_gps_at=timestamp,
                    risk_updated_at=timestamp
                )
            )

        # Audit log for significant deviation or risk
        if risk_score > 50:
            audit_service.log_action(
                user=actor_id,
                role=actor_role,
                action="HIGH_RISK_DETECTED",
                entity="SHIPMENT",
                entity_id=shipment_id,
                new_value={"risk_score": risk_score, "route_deviation": route_deviation}
            )
            
        return {
            "shipment_id": shipment_id,
            "lat": lat,
            "lng": lng,
            "risk_score": risk_score,
            "route_deviation": route_deviation,
            "updated_at": timestamp.isoformat()
        }

    @staticmethod
    def assign_vehicle(shipment_id: str, truck_id: str, driver_id: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            shipment = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            
            if not shipment:
                raise ValueError("Shipment not found")
                
            conn.execute(
                update(shipments_table)
                .where(shipments_table.c.shipment_id == shipment_id)
                .values(
                    vehicle_number=truck_id,
                    assignment_status="ASSIGNED",
                    status="IN_TRANSIT",
                    updated_at=timestamp
                )
            )

        audit_service.log_action(
            user=actor_id,
            role=actor_role,
            action="VEHICLE_ASSIGNED",
            entity="SHIPMENT",
            entity_id=shipment_id,
            new_value={"truck_id": truck_id, "driver_id": driver_id}
        )
            
        return {
            "shipment_id": shipment_id,
            "truck_id": truck_id,
            "driver_id": driver_id,
            "status": "ASSIGNED"
        }

tracking_service = TrackingService()
