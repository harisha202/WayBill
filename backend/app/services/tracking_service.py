from __future__ import annotations
from datetime import datetime, timezone
import math
from sqlalchemy import insert, select, update
from typing import Dict, Any, List

from app.services.database_service import _engine, shipments_table, trucks_table, drivers_table, gps_events_table, interventions_table
from app.services.audit_service import audit_service
from app.services.domain_events import emit_event_sync

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
    def geocode(location: str) -> tuple[float, float]:
        if not location:
            return 20.0, 80.0
        cities = {
            "mumbai": (19.0760, 72.8777),
            "delhi": (28.7041, 77.1025),
            "bangalore": (12.9716, 77.5946),
            "chennai": (13.0827, 80.2707),
            "hyderabad": (17.3850, 78.4867),
            "kolkata": (22.5726, 88.3639),
            "pune": (18.5204, 73.8567),
            "ahmedabad": (23.0225, 72.5714),
        }
        loc = str(location).lower()
        for city, coords in cities.items():
            if city in loc:
                return coords
        import hashlib
        h = int(hashlib.md5(loc.encode()).hexdigest(), 16)
        lat = 10.0 + (h % 20000) / 1000.0
        lng = 70.0 + ((h // 20000) % 20000) / 1000.0
        return lat, lng

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

            dest_lat, dest_lng = TrackingService.geocode(shipment.destination)
            distance_km = TrackingService.calculate_distance(lat, lng, dest_lat, dest_lng)
            eta_minutes = int((distance_km / max(speed, 20.0)) * 60)

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
                    vehicle_id=shipment.vehicle_number,
                    latitude=lat,
                    longitude=lng,
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
            emit_event_sync(
                "RISK_CHANGED",
                payload={"shipment_id": shipment_id, "risk_score": risk_score, "route_deviation": route_deviation},
                notify_roles=["admin", "transporter"],
                notify_severity="critical",
                notify_title="High Risk Detected",
                notify_message=f"Shipment {shipment_id} has a high risk score of {risk_score}."
            )
            
        payload = {
            "shipment_id": shipment_id,
            "vehicle_id": shipment.vehicle_number,
            "lat": lat,
            "lng": lng,
            "speed": speed,
            "heading": heading,
            "eta_minutes": eta_minutes,
            "delay_minutes": max(0, eta_minutes - 60) if eta_minutes is not None else None,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "route_deviation": route_deviation,
            "timestamp": timestamp.isoformat()
        }

        emit_event_sync(
            "GPS_UPDATED",
            payload=payload,
            ws_roles=["transporter", "admin"]
        )

        return payload

    def assign_vehicle(self, shipment_id: str, truck_id: str, driver_id: str, actor_id: str, actor_role: str) -> Dict[str, Any]:
        timestamp = datetime.now(timezone.utc)
        
        with _engine().begin() as conn:
            shipment = conn.execute(
                select(shipments_table).where(shipments_table.c.shipment_id == shipment_id)
            ).first()
            
            if not shipment:
                raise ValueError("Shipment not found")
            truck = conn.execute(
                select(trucks_table).where(trucks_table.c.plate_number == truck_id)
            ).first()
            if not truck:
                raise ValueError("Truck not found")
            if str(truck.maintenance_status or "").lower() in {"maintenance", "unavailable", "out_of_service"}:
                raise ValueError("Truck is not available for assignment")
            if shipment.weight is not None and truck.capacity is not None and float(shipment.weight) > float(truck.capacity):
                raise ValueError("Shipment weight exceeds truck capacity")

            driver = conn.execute(
                select(drivers_table).where(drivers_table.c.license_id == driver_id)
            ).first()
            if not driver:
                raise ValueError("Driver not found")
                
            conn.execute(
                update(shipments_table)
                .where(shipments_table.c.shipment_id == shipment_id)
                .values(
                    vehicle_number=truck_id,
                    assignment_status="ASSIGNED",
                    transporter_id=actor_id if actor_role == "transporter" else None,
                    status="IN_TRANSIT",
                    timestamp=timestamp
                )
            )

        audit_service.log_action(actor_id, actor_role, "VEHICLE_ASSIGNED", "SHIPMENT", shipment_id, new_value={"truck_id": truck_id, "driver_id": driver_id})
        emit_event_sync(
            "SHIPMENT_ASSIGNED",
            payload={"shipment_id": shipment_id, "truck_id": truck_id, "driver_id": driver_id},
            notify_roles=["dealer", "admin"],
            notify_title="Vehicle Assigned",
            notify_message=f"Vehicle {truck_id} assigned to shipment {shipment_id}."
        )
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
