import asyncio
import json
import time
import uuid
import pytest
import pytest_asyncio
from concurrent.futures import ThreadPoolExecutor
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from run import app
from app.api.auth import create_access_token
from app.models.user import UserRole
from app.services.database_service import _engine, products_table, orders_table
from app.services.websocket_manager import manager as ws_manager

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_duplicate_order_request_protection(async_client):
    """GATE 4: Duplicate request protection (Idempotency key enforcement)."""
    # 1. Dealer token
    token = create_access_token(subject="dealer@globalsupply.com", role=UserRole.dealer)
    headers = {"Authorization": f"Bearer {token}"}

    sku = f"SKU-IDEM-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(
            text(f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
                 f"VALUES ('{sku}', 'Idempotency Product', 500, 25.0, 500, 0, 0, 0, 0, CURRENT_TIMESTAMP)")
        )

    fixed_key = f"IDEM-KEY-{uuid.uuid4().hex}"
    payload = {
        "idempotency_key": fixed_key,
        "retailer_name": "Retail Corp A",
        "retailer_email": "retail_idem@example.com",
        "dealer_id": "dealer",
        "product_sku": sku,
        "quantity": 25
    }

    # Send 5 identical requests concurrently with the EXACT same idempotency key
    tasks = [
        async_client.post("/api/dealer/orders/retail", json=payload, headers=headers)
        for _ in range(5)
    ]
    responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    # At most 1 should be 200 (created), rest must be rejected (400 or 409) or return the identical idempotent order
    success_responses = [r for r in responses if r.status_code == 200]
    
    # Check that stock was deducted ONLY ONCE for 25 units
    with _engine().connect() as conn:
        prod = conn.execute(text(f"SELECT available_stock FROM products WHERE sku='{sku}'")).fetchone()
        assert prod[0] == 475, f"Expected 475 available stock after idempotency protection, got {prod[0]}"

    assert len(success_responses) >= 1

@pytest.mark.asyncio
async def test_concurrent_stock_mutations_and_lost_update_prevention(async_client):
    """GATE 2 & 3: Concurrent API operations & Database transaction integrity."""
    token = create_access_token(subject="retail@globalsupply.com", role=UserRole.retail_shop)
    headers = {"Authorization": f"Bearer {token}"}

    sku = f"SKU-CONC-STOCK-{uuid.uuid4().hex[:6]}"
    initial_stock = 20
    with _engine().begin() as conn:
        conn.execute(
            text(f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
                 f"VALUES ('{sku}', 'High Concurrency Stock Item', {initial_stock}, 15.0, {initial_stock}, 0, 0, 0, 0, CURRENT_TIMESTAMP)")
        )

    # 30 concurrent sale checkouts of quantity 1 each (exceeding initial_stock of 20)
    async def attempt_pos_sale():
        return await async_client.post(
            "/api/retail/sales",
            json={
                "sku": sku,
                "quantity": 1
            },
            headers=headers
        )

    results = await asyncio.gather(*[attempt_pos_sale() for _ in range(30)])
    success_count = sum(1 for r in results if r.status_code in (200, 201))
    failure_count = sum(1 for r in results if r.status_code in (400, 409, 422))

    assert success_count == initial_stock, f"Expected exactly {initial_stock} sales to succeed, but {success_count} succeeded"
    assert failure_count == 10, f"Expected exactly 10 requests to fail due to stock depletion, but {failure_count} failed"

    with _engine().connect() as conn:
        final_stock = conn.execute(text(f"SELECT available_stock, quantity FROM products WHERE sku='{sku}'")).fetchone()
        assert final_stock[0] == 0, f"Available stock must be exactly 0, got {final_stock[0]}"

@pytest.mark.asyncio
async def test_cross_role_and_company_isolation(async_client):
    """GATE 5: Cross-role and company data isolation."""
    admin_token = create_access_token(subject="admin@globalsupply.com", role=UserRole.admin)
    dealer_token = create_access_token(subject="dealer@globalsupply.com", role=UserRole.dealer)
    retail_token = create_access_token(subject="retail@globalsupply.com", role=UserRole.retail_shop)

    # Retail cannot access admin users endpoint
    res1 = await async_client.get("/api/admin/users", headers={"Authorization": f"Bearer {retail_token}"})
    assert res1.status_code == 403, f"Retail user should receive 403 on admin endpoint, got {res1.status_code}"

    # Dealer cannot trigger manufacturer production
    res2 = await async_client.post("/api/manufacturer/orders", json={"sku": "SKU-NONE", "quantity": 10}, headers={"Authorization": f"Bearer {dealer_token}"})
    assert res2.status_code == 403, f"Dealer user should receive 403 on mfg orders endpoint, got {res2.status_code}"

    # Retail cannot trigger transporter fleet management
    res3 = await async_client.get("/api/tracking/fleet", headers={"Authorization": f"Bearer {retail_token}"})
    assert res3.status_code == 403, f"Retail user should receive 403 on transporter fleet endpoint, got {res3.status_code}"

@pytest.mark.asyncio
async def test_websocket_broadcast_and_isolation():
    """GATE 6: WebSocket and notification behavior under parallel load."""
    class DummyWS:
        def __init__(self):
            self.sent_messages = []
            self.is_open = True

        async def accept(self):
            pass

        async def send_text(self, data: str):
            if not self.is_open:
                raise RuntimeError("Connection closed")
            self.sent_messages.append(data)

    ws_admin = DummyWS()
    ws_retail = DummyWS()

    # Connect admin and retail to ws_manager
    await ws_manager.connect(ws_admin, user_id="admin_1", role="admin")
    await ws_manager.connect(ws_retail, user_id="retail_1", role="retail_shop")

    # Broadcast event targeted ONLY to admin and transporter
    event_payload = {"type": "DISPUTE_RAISED", "dispute_id": "DSP-1234"}
    await ws_manager.broadcast_to_roles("DISPUTE_RAISED", event_payload, roles=["admin", "transporter"])

    assert len(ws_admin.sent_messages) == 1, "Admin should have received role-filtered broadcast"
    assert len(ws_retail.sent_messages) == 0, "Retail should NOT receive admin-targeted broadcast"

    # Cleanup
    ws_manager.disconnect(ws_admin)
    ws_manager.disconnect(ws_retail)
