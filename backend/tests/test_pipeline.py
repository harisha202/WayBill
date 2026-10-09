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

@pytest.fixture(autouse=True)
def setup_teardown():
    from sqlalchemy import text
    from app.core.security import hash_password
    with _engine().begin() as conn:
        pw = hash_password("dealer123")
        conn.execute(text(f"DELETE FROM users WHERE email='dealer@waybill.com' OR username='dealer'"))
        conn.execute(text(f"INSERT INTO users (username, name, email, password_hash, role, company_name, is_active, failed_login_attempts, created_at) VALUES ('dealer', 'Dealer', 'dealer@waybill.com', '{pw}', 'dealer', 'Dealer XYZ', 1, 0, CURRENT_TIMESTAMP)"))
    yield

@pytest_asyncio.fixture
async def dealer_headers(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "dealer", "email": "dealer@waybill.com", "company_name": "Dealer XYZ", "password": "dealer123"}
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

    # 2. Receiving before dispatch must be blocked
    receive_payload = {
        "idempotency_key": uuid.uuid4().hex,
        "received_quantity": 70
    }
    early_receive = await async_client.patch(
        f"/api/dealer/orders/{order_code}/receive",
        json=receive_payload,
        headers=dealer_headers
    )
    assert early_receive.status_code == 400
    assert "cannot be received" in early_receive.text

    with _engine().begin() as conn:
        conn.execute(text(f"UPDATE orders SET current_stage = 'dispatched', status = 'dispatched' WHERE order_code = '{order_code}'"))

    # 3. Receive 70 after dispatch
    res_receive = await async_client.patch(
        f"/api/dealer/orders/{order_code}/receive", 
        json=receive_payload, 
        headers=dealer_headers
    )
    assert res_receive.status_code == 200, res_receive.text

    # 4. Check backorders for this order_code
    res_backorders = await async_client.get("/api/dealer/orders/backorders", headers=dealer_headers)
    assert res_backorders.status_code == 200, res_backorders.text
    
    backorders = res_backorders.json()["items"]
    # Filter backorders by order_code
    order_backorders = [b for b in backorders if b["order_id"] == order_code]
    
    assert len(order_backorders) == 1, "Expected exactly 1 backorder record for this order."
    assert order_backorders[0]["missing_quantity"] == 30, f"Expected 30 missing, got {order_backorders[0]['missing_quantity']}"
