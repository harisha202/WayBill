from __future__ import annotations
from datetime import datetime, timezone
import math
from sqlalchemy import insert, select, update
from typing import Dict, Any, List

from app.services.database_service import _engine, shipments_table, trucks_table, drivers_table, waybill_documents_table, gps_events_table, interventions_table
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

    def ingest_gps_ping(
        self,
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

            # Real calculations
            # To calculate route deviation, we need destination. We don't have lat/lng of destination natively, 
            # so we'll just proxy the deviation based on speed anomalies for now, or if we had a planned route 
            # table we would cross-track. Let's use distance from origin to current vs total.
            
            # Simple Eta: distance / speed
            # Assume destination is roughly at (0, 0) if not provided, just for mathematical structure, 
            # but ideally we would look up destination warehouse lat/lng.
            # Here we'll just set a mock destination 100km away for calculation.
            dest_lat = lat + 1.0 # approx 111km away
            dest_lng = lng + 1.0
            
            distance_to_dest = self.calculate_distance(lat, lng, dest_lat, dest_lng)
            
            eta_minutes = 0
            if speed > 0:
                eta_minutes = int((distance_to_dest / speed) * 60)
            else:
                eta_minutes = 999
            
            risk_score = 0.0
            if speed > 90:
                risk_score += 25.0
            if speed == 0:
                risk_score += 10.0
            if eta_minutes > 120:
                risk_score += 20.0
            
            route_deviation = "LOW"
            if risk_score > 30:
                route_deviation = "HIGH"
                
            risk_level = "LOW"
            if risk_score > 50:
                risk_level = "CRITICAL"
            elif risk_score > 25:
                risk_level = "MEDIUM"
                
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
            
            # Persist GPS event
            conn.execute(
                insert(gps_events_table).values(
                    shipment_id=shipment_id,
                    lat=lat,
                    lng=lng,
                    speed=speed,
                    heading=heading,
                    timestamp=timestamp
                )
            )

        if risk_score > 50:
            audit_service.log_action(
                user=actor_id,
                role=actor_role,
                action="HIGH_RISK_DETECTED",
                entity="SHIPMENT",
                entity_id=shipment_id,
                new_value={"risk_score": risk_score, "route_deviation": route_deviation}
            )
            
        payload = {
            "shipment_id": shipment_id,
            "vehicle_id": shipment.vehicle_number,
            "lat": lat,
            "lng": lng,
            "speed": speed,
            "heading": heading,
            "eta_minutes": eta_minutes,
            "delay_minutes": max(0, eta_minutes - 60),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "route_deviation": route_deviation,
            "timestamp": timestamp.isoformat()
        }

        return payload

    def assign_vehicle(self, shipment_id: str, truck_id: str, driver_id: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
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

        audit_service.log_action(actor_id, actor_role, "VEHICLE_ASSIGNED", "SHIPMENT", shipment_id, new_value={"truck_id": truck_id, "driver_id": driver_id})
        return {"shipment_id": shipment_id, "truck_id": truck_id, "driver_id": driver_id, "status": "ASSIGNED"}

    def log_intervention(self, shipment_id: str, action_type: str, reason: str, severity: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)
        intervention_id = f"INT_{int(timestamp.timestamp())}"
        
        with _engine().begin() as conn:
            conn.execute(
                insert(interventions_table).values(
                    intervention_id=intervention_id,
                    shipment_id=shipment_id,
                    action_type=action_type,
                    reason=reason,
                    severity=severity,
                    status="OPEN",
                    actor_id=actor_id,
                    created_at=timestamp
                )
            )
            
        audit_service.log_action(actor_id, actor_role, f"INTERVENTION_{action_type}", "SHIPMENT", shipment_id, new_value={"reason": reason})
        return {"intervention_id": intervention_id, "status": "OPEN"}

tracking_service = TrackingService()
