import asyncio
import random
import logging
from datetime import datetime
from app.services.database_service import create_or_update_shipment, update_shipment_location
from app.services.tracking_service import TrackingService
from app.api.websocket import manager
from app.models.tracking import GPSEvent

logger = logging.getLogger(__name__)

def lerp(a, b, t):
    return a + (b - a) * t

async def simulate_gps_ping():
    logger.info("Starting advanced GPS simulation (Bangalore -> Chennai)")
    
    vehicle_id = "TRUCK-001"
    shipment_id = "SHP-001"
    num_steps = 500
    delay_seconds = 4
    
    start_lat, start_lng = 12.9716, 77.5946
    end_lat, end_lng = 13.0827, 80.2707
    
    i = 0
    while True:
        t = (i % num_steps) / float(num_steps)
        
        current_lat = lerp(start_lat, end_lat, t)
        current_lng = lerp(start_lng, end_lng, t)
        
        # Simulate severe route deviation midway
        if (i % num_steps) > 100 and (i % num_steps) < 150:
            current_lat += 0.2
            current_lng -= 0.1
            speed = 15.0
        else:
            speed = 55.0

        event = GPSEvent(
            vehicle_id=vehicle_id,
            shipment_id=shipment_id,
            latitude=current_lat,
            longitude=current_lng,
            speed=speed,
            heading=90.0,
            timestamp=datetime.utcnow().isoformat(),
            accuracy=1.0
        )
        
        try:
            state_update = TrackingService.ingest_gps_ping(
                shipment_id=event.shipment_id,
                lat=event.latitude,
                lng=event.longitude,
                speed=event.speed,
                heading=event.heading,
                actor_id="system_sim",
                actor_role="system"
            )
            await manager.broadcast({
                "event": "shipment.location.updated",
                "data": state_update
            })
            # logger.info(f"Broadcasted GPS ping for {vehicle_id}")
        except Exception as e:
            logger.error(f"Failed to process/broadcast GPS ping: {e}")
            
        i += 1
        await asyncio.sleep(delay_seconds)

async def simulate_truck_movement():
    logger.info("Starting legacy truck movement simulation in backend...")
    start_lat = 19.0760
    start_lng = 72.8777
    shipment_id = "TRK-001"
    
    try:
        create_or_update_shipment(
            shipment_id=shipment_id,
            lat=start_lat,
            lng=start_lng,
            status="in_transit",
            origin="Mumbai",
            destination="Delhi",
            vehicle_number="MH-01-AB-1234",
            assignment_status="Assigned",
            order_code=None
        )
    except Exception as e:
        logger.error(f"Failed to create simulation shipment: {e}")
        return

    lat = start_lat
    lng = start_lng

    while True:
        await asyncio.sleep(6)
        lat += random.uniform(0.005, 0.015)
        lng += random.uniform(0.005, 0.015)
        
        try:
            update_shipment_location(
                shipment_id=shipment_id,
                lat=lat,
                lng=lng,
                status="in_transit"
            )
        except Exception as e:
            logger.error(f"Failed to update simulation shipment: {e}")

def start_simulation(app):
    asyncio.create_task(simulate_truck_movement())
    asyncio.create_task(simulate_gps_ping())
