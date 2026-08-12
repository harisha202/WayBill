import time
import requests
import math
from datetime import datetime

# Bangalore (Start) to Chennai (End)
# A simple straight line interpolation for demo purposes

def lerp(a, b, t):
    return a + (b - a) * t

def simulate_truck_trip(vehicle_id="TRUCK-001", shipment_id="SHP-001", num_steps=20, delay_seconds=2):
    start_lat, start_lng = 12.9716, 77.5946
    end_lat, end_lng = 13.0827, 80.2707
    
    # Intentionally deviate on the 10th step to trigger high risk
    
    for i in range(num_steps + 1):
        t = i / float(num_steps)
        
        current_lat = lerp(start_lat, end_lat, t)
        current_lng = lerp(start_lng, end_lng, t)
        
        # Simulate severe route deviation midway
        if i >= 10 and i <= 15:
            current_lat += 0.2
            current_lng -= 0.1
            speed = 15.0 # Traffic/slow down
        else:
            speed = 55.0

        payload = {
            "vehicle_id": vehicle_id,
            "shipment_id": shipment_id,
            "latitude": current_lat,
            "longitude": current_lng,
            "speed": speed,
            "heading": 90.0,
            "timestamp": datetime.utcnow().isoformat(),
            "accuracy": 1.0
        }
        
        try:
            res = requests.post("http://127.0.0.1:8000/api/tracking/gps", json=payload)
            print(f"[{i}/{num_steps}] Sent GPS for {vehicle_id} at {current_lat:.4f}, {current_lng:.4f} -> {res.status_code}")
        except Exception as e:
            print(f"Failed to send GPS: {e}")
            
        time.sleep(delay_seconds)

if __name__ == "__main__":
    print("Starting GPS Simulator... Make sure backend is running on port 8000")
    simulate_truck_trip()
