import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.services.database_service import get_user_by_email, create_user
from app.core.security import hash_password

import os
os.environ.setdefault("MOCK_EMAIL_DELIVERY", "true")
from run import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
def setup_teardown():
    try:
        user = get_user_by_email("admin@waybill.com")
        if not user:
            create_user(
                username="admin",
                password_hash=hash_password("admin123"),
                name="Admin User",
                email="admin@waybill.com",
                role="admin",
                company_name="WayBill HQ",
                phone="1234567890"
            )
            
        user = get_user_by_email("target@waybill.com")
        if not user:
            create_user(
                username="target",
                password_hash=hash_password("password123"),
                name="Target User",
                email="target@waybill.com",
                role="manufacturer",
                company_name="Test Company",
                phone="1234567890"
            )
    except:
        pass
    yield

@pytest.mark.asyncio
async def test_admin_send_reset_otp(async_client):
    login_resp = await async_client.post("/api/auth/login", json={
        "username": "admin",
        "email": "admin@waybill.com",
        "company_name": "WayBill HQ",
        "password": "admin123"
    })
    token = login_resp.json()["access_token"]
    
    from app.services.database_service import get_user_by_email
    target_user = get_user_by_email("target@waybill.com")
    
    resp = await async_client.post(
        f"/api/admin/users/{target_user['id']}/reset-password/send-otp",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
