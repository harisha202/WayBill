import asyncio
import random
import logging
from app.services.database_service import create_or_update_shipment, update_shipment_location

logger = logging.getLogger(__name__)

async def simulate_truck_movement():
    logger.info("Starting truck movement simulation in backend...")
    
    start_lat = 19.0760
    start_lng = 72.8777
    shipment_id = "TRK-001"
    
    # Initialize the shipment
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
        await asyncio.sleep(4)
        
        # Move slightly north-east towards Delhi
        lat += random.uniform(0.005, 0.015)
        lng += random.uniform(0.005, 0.015)
        
        try:
            update_shipment_location(
                shipment_id=shipment_id,
                lat=lat,
                lng=lng,
                status="in_transit"
            )
            # logger.info(f"Simulated truck {shipment_id} moved to {lat:.4f}, {lng:.4f}")
        except Exception as e:
            logger.error(f"Failed to update simulation shipment: {e}")

def start_simulation(app):
    asyncio.create_task(simulate_truck_movement())
