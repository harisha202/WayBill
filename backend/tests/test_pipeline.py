import os
import uuid
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
async def test_pipeline_partial_receipt_backorder(async_client, dealer_headers):
    # Setup product with 100 stock
    sku = f"SKU-PIPELINE-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(
            text(f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
                 f"VALUES ('{sku}', 'Test Pipeline', 150, 10.0, 150, 0, 0, 0, 0, CURRENT_TIMESTAMP)")
        )

    # 1. Order 100
    payload = {
        "idempotency_key": uuid.uuid4().hex,
        "retailer_name": "Retailer A",
        "retailer_email": "retail@example.com",
        "dealer_id": "dealer",
        "product_sku": sku,
        "quantity": 100
    }
    res_order = await async_client.post("/api/dealer/orders/retail", json=payload, headers=dealer_headers)
    assert res_order.status_code == 200, res_order.text
    order_code = res_order.json()["data"]["order"]["order_code"]

    # 2. Receive 70
    receive_payload = {
        "idempotency_key": uuid.uuid4().hex,
        "received_quantity": 70
    }
    res_receive = await async_client.patch(
        f"/api/dealer/orders/{order_code}/receive", 
        json=receive_payload, 
        headers=dealer_headers
    )
    assert res_receive.status_code == 200, res_receive.text

    # 3. Check backorders for this order_code
    res_backorders = await async_client.get("/api/dealer/orders/backorders", headers=dealer_headers)
    assert res_backorders.status_code == 200, res_backorders.text
    
    backorders = res_backorders.json()["items"]
    # Filter backorders by order_code
    order_backorders = [b for b in backorders if b["order_id"] == order_code]
    
    assert len(order_backorders) == 1, "Expected exactly 1 backorder record for this order."
    assert order_backorders[0]["missing_quantity"] == 30, f"Expected 30 missing, got {order_backorders[0]['missing_quantity']}"
