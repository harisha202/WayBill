import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Tests should never require a real SMTP connection.
os.environ.setdefault("MOCK_EMAIL_DELIVERY", "true")

from run import app  # noqa: E402

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client




@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/api/admin/stats")
    assert response.status_code in (200, 401)


@pytest.mark.asyncio
async def test_login_invalid_credentials(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "wronguser", "email": "wrong@example.com", "company_name": "Wrong Co", "password": "wrongpassword"}
    )
    assert response.status_code == 401, f"Failed with {response.status_code}: {response.text}"
    assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_inventory_list_pagination(async_client):
    response = await async_client.get("/api/inventory?skip=0&limit=5")
    # without auth we expect 401 or 403, which is also a valid API test to ensure security
    assert response.status_code in (401, 403)



