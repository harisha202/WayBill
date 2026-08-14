import pytest
from fastapi.testclient import TestClient
from run import app
from app.api.auth import create_access_token
from app.models.user import UserRole

client = TestClient(app)

def get_admin_headers():
    token = create_access_token(subject="admin@waybill.com", role=UserRole.admin)
    return {"Authorization": f"Bearer {token}"}

def get_non_admin_headers():
    token = create_access_token(subject="dealer@waybill.com", role=UserRole.dealer)
    return {"Authorization": f"Bearer {token}"}

def test_admin_can_list_users():
    response = client.get("/api/admin/users", headers=get_admin_headers())
    assert response.status_code == 200
    data = response.json()
    assert "password" not in str(data)
    assert "password_hash" not in str(data)

def test_admin_can_create_manufacturer():
    payload = {
        "username": "test_mfg_01",
        "password": "password123",
        "full_name": "Test Manufacturer",
        "email": "testmfg@example.com",
        "role": UserRole.manufacturer.value,
        "company_name": "Test Mfg Co"
    }
    response = client.post("/api/admin/users", json=payload, headers=get_admin_headers())
    assert response.status_code == 200
    assert response.json()["data"]["username"] == "test_mfg_01"
    
def test_admin_cannot_create_manufacturer_without_company():
    payload = {
        "username": "test_mfg_02",
        "password": "password123",
        "full_name": "Test Manufacturer 2",
        "email": "testmfg2@example.com",
        "role": UserRole.manufacturer.value,
        "company_name": ""
    }
    response = client.post("/api/admin/users", json=payload, headers=get_admin_headers())
    assert response.status_code == 400

def test_admin_cannot_create_admin():
    payload = {
        "username": "new_admin",
        "password": "password123",
        "full_name": "New Admin",
        "email": "admin2@example.com",
        "role": UserRole.admin.value
    }
    response = client.post("/api/admin/users", json=payload, headers=get_admin_headers())
    assert response.status_code == 400

def test_non_admin_cannot_list_users():
    response = client.get("/api/admin/users", headers=get_non_admin_headers())
    assert response.status_code == 403

def test_non_admin_cannot_create_users():
    payload = {
        "username": "test_dealer_01",
        "password": "password123",
        "full_name": "Test Dealer",
        "email": "testdlr@example.com",
        "role": UserRole.dealer.value,
        "company_name": "Test Dealer Co"
    }
    response = client.post("/api/admin/users", json=payload, headers=get_non_admin_headers())
    assert response.status_code == 403

# And run tests for activity logs to ensure audit happened
def test_audit_log_created_for_user_creation():
    response = client.get("/api/admin/activity-logs?limit=5", headers=get_admin_headers())
    assert response.status_code == 200
    logs = response.json()["logs"]
    # Check if any log has USER_CREATED
    assert any(log["action"] == "USER_CREATED" for log in logs)
