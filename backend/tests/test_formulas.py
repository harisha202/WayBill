from app.services.tracking_service import TrackingService

def test_haversine_distance():
    dist = TrackingService.calculate_distance(0, 0, 0, 1)
    assert 110 <= dist <= 112

def test_haversine_distance_zero():
    dist = TrackingService.calculate_distance(45.0, 45.0, 45.0, 45.0)
    assert dist == 0.0
