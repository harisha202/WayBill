import os
import uuid
import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

os.environ.setdefault("MOCK_EMAIL_DELIVERY", "true")

from run import app  # noqa: E402
from app.services.database_service import _engine  # noqa: E402

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def dealer_headers(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": "dealer@waybill.com", "password": "dealer123", "role": "dealer"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_concurrency_order_creation(async_client, dealer_headers):
    # Setup product with 100 stock
    sku = f"SKU-CONCUR-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(
            text(f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
                 f"VALUES ('{sku}', 'Test Concurrency', 100, 10.0, 100, 0, 0, 0, 0, CURRENT_TIMESTAMP)")
        )

    async def make_order_request():
        payload = {
            "idempotency_key": uuid.uuid4().hex,
            "retailer_name": "Retailer A",
            "retailer_email": "retail@example.com",
            "dealer_id": "dealer",
            "product_sku": sku,
            "quantity": 80
        }
        return await async_client.post("/api/dealer/orders/retail", json=payload, headers=dealer_headers)
    
    # Fire 5 concurrent requests
    responses = await asyncio.gather(*(make_order_request() for _ in range(5)))
    
    success_count = sum(1 for res in responses if res.status_code == 200)
    failed_count = sum(1 for res in responses if res.status_code in (400, 422, 503))
    
    assert success_count == 1, f"Expected exactly 1 success, got {success_count}"
    assert failed_count == 4, f"Expected exactly 4 failures, got {failed_count}"
