import asyncio
import random
import logging
from datetime import datetime, timezone
from app.services.database_service import _engine, shipments_table
from sqlalchemy import select
from app.services.tracking_service import tracking_service
from app.services.websocket_manager import manager
from app.models.tracking import GPSEvent

logger = logging.getLogger(__name__)

def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

async def simulate_gps_ping():
    logger.info("Starting unified GPS telematics simulation across active shipments...")
    
    num_steps = 200
    delay_seconds = 5
    step = 0
    
    while True:
        try:
            with _engine().begin() as conn:
                shipment_rows = conn.execute(
                    select(shipments_table).where(
                        shipments_table.c.status.in_(["in_transit", "IN_TRANSIT", "ASSIGNED"])
                    )
                ).fetchall()

                if not shipment_rows:
                    shipment_rows = conn.execute(
                        select(shipments_table).order_by(shipments_table.c.id.desc()).limit(8)
                    ).fetchall()

            for s in shipment_rows:
                s_dict = dict(s._mapping)
                shipment_id = s_dict.get("shipment_id")
                if not shipment_id:
                    continue

                origin = s_dict.get("origin") or "Bangalore"
                destination = s_dict.get("destination") or "Chennai"
                
                start_lat, start_lng = tracking_service.geocode(origin)
                end_lat, end_lng = tracking_service.geocode(destination)
                
                offset = abs(hash(shipment_id)) % num_steps
                t = ((step + offset) % num_steps) / float(num_steps)
                
                cur_lat = lerp(start_lat, end_lat, t)
                cur_lng = lerp(start_lng, end_lng, t)
                
                speed = 45.0 + (abs(hash(shipment_id) + step) % 30)
                heading = 90.0
                
                state_update = tracking_service.ingest_gps_ping(
                    shipment_id=shipment_id,
                    lat=round(cur_lat, 6),
                    lng=round(cur_lng, 6),
                    speed=speed,
                    heading=heading,
                    actor_id="telematics_sim",
                    actor_role="system"
                )
                
                await manager.broadcast_event("shipment.location.updated", state_update)
                await manager.broadcast_event("GPS_UPDATED", state_update)
                
        except Exception as e:
            logger.error(f"Error in GPS telematics simulation: {e}")
            
        step += 1
        await asyncio.sleep(delay_seconds)

def start_simulation(app):
    import os
    enabled = os.getenv("ENABLE_GPS_SIMULATION", "true").lower() in ("true", "1", "yes")
    if enabled:
        asyncio.create_task(simulate_gps_ping())
        logger.info("GPS telematics background simulation task launched.")
    else:
        logger.info("GPS simulation is disabled (set ENABLE_GPS_SIMULATION=true to enable).")
