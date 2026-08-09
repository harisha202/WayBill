import time
import random
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.database_service import create_or_update_shipment, update_shipment_location

def simulate():
    print("Creating shipment in database...")
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
        print(f"Failed to create shipment: {e}")
        return

    print("Shipment created. Starting movement simulation...")
    
    lat = start_lat
    lng = start_lng
    
    while True:
        lat += random.uniform(0.005, 0.015)
        lng += random.uniform(0.005, 0.015)
        
        try:
            update_shipment_location(
                shipment_id=shipment_id,
                lat=lat,
                lng=lng,
                status="in_transit"
            )
            print(f"Moved TRK-001 to {lat:.4f}, {lng:.4f}")
        except Exception as e:
            print(f"Failed to update shipment: {e}")
            
        time.sleep(3)

if __name__ == "__main__":
    simulate()
