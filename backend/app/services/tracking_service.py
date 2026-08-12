import math
from datetime import datetime
from typing import Dict, Any, List
from app.models.tracking import GPSEvent, GPSHistory

# Mock databases for demonstration purposes (in production, use DB service)
gps_history_db: List[GPSHistory] = []
audit_log_db: List[Dict[str, Any]] = []

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine formula
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def process_gps_ping(event: GPSEvent) -> Dict[str, Any]:
    # 1. Validate (Pydantic model already validates types)
    # 2. Persist
    history = GPSHistory(**event.dict())
    gps_history_db.append(history)
    
    # 3. Calculate Distance from planned route (Mocking planned route for now)
    planned_lat, planned_lng = 12.9710, 77.5940
    route_deviation_km = calculate_distance(event.latitude, event.longitude, planned_lat, planned_lng)
    
    # 4. Calculate ETA (Mocking destination)
    dest_lat, dest_lng = 13.0827, 80.2707 # Chennai
    distance_to_dest = calculate_distance(event.latitude, event.longitude, dest_lat, dest_lng)
    speed_kmh = event.speed if event.speed > 0 else 40.0
    eta_hours = distance_to_dest / speed_kmh
    eta_minutes = int(eta_hours * 60)
    
    # 5. Calculate Delay Risk
    predicted_delay_minutes = 0
    if route_deviation_km > 10:
        predicted_delay_minutes += 30
    if speed_kmh < 20:
        predicted_delay_minutes += 45
        
    delay_risk_score = 0
    if predicted_delay_minutes > 60 or route_deviation_km > 20:
        delay_risk_score = 85
        risk_level = "CRITICAL"
        reason = f"Vehicle is {route_deviation_km:.1f} km off route and delayed."
    elif predicted_delay_minutes > 20:
        delay_risk_score = 55
        risk_level = "HIGH"
        reason = f"Vehicle is delayed by {predicted_delay_minutes} minutes."
    else:
        delay_risk_score = 15
        risk_level = "LOW"
        reason = "On track"
        
    # 6. Update Shipment State (Mock)
    state_update = {
        "event_id": f"evt_{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": datetime.utcnow().isoformat(),
        "shipment_id": event.shipment_id,
        "vehicle_id": event.vehicle_id,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "delay_risk_score": delay_risk_score,
        "risk_level": risk_level,
        "predicted_delay_minutes": predicted_delay_minutes,
        "route_deviation_km": round(route_deviation_km, 2),
        "reason": reason,
        "eta_minutes": eta_minutes
    }
    
    # 7. Create Audit Event
    if risk_level in ["HIGH", "CRITICAL"]:
        audit_log_db.append({
            "action": "RISK_ESCALATED",
            "shipment_id": event.shipment_id,
            "details": reason,
            "timestamp": state_update["timestamp"]
        })
        
    return state_update
