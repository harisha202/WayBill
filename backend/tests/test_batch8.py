import pytest
import uuid
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.services.database_service import _engine
from sqlalchemy import text
from run import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture(autouse=True)
def setup_users():
    from app.core.security import hash_password
    with _engine().begin() as conn:
        pw = hash_password("testpass")
        # Ensure test users exist
        conn.execute(text("DELETE FROM users WHERE username IN ('test_admin', 'test_dealer', 'test_retail')"))
        conn.execute(text(f"""
            INSERT INTO users (username, name, email, password_hash, role, company_name, is_active, failed_login_attempts, created_at) VALUES 
            ('test_admin', 'Admin', 'admin@test.com', '{pw}', 'admin', 'HQ', 1, 0, CURRENT_TIMESTAMP),
            ('test_dealer', 'Dealer', 'dealer@test.com', '{pw}', 'dealer', 'HQ', 1, 0, CURRENT_TIMESTAMP),
            ('test_retail', 'Retail', 'retail@test.com', '{pw}', 'retail_shop', 'HQ', 1, 0, CURRENT_TIMESTAMP)
        """))
    yield

async def get_token(client, username):
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "email": f"{username.split('_')[1]}@test.com",
        "company_name": "HQ",
        "password": "testpass"
    })
    return resp.json()["access_token"]

@pytest.mark.asyncio
async def test_tracking_gps_ingestion():
    from app.services.tracking_service import tracking_service
    shipment_id = f"SHP-{uuid.uuid4().hex[:6]}"
    
    with _engine().begin() as conn:
        conn.execute(text(f"INSERT INTO shipments (shipment_id, lat, lng, status, origin, destination, vehicle_number, assignment_status, timestamp) VALUES ('{shipment_id}', 10.0, 20.0, 'in_transit', 'A', 'B', 'V1', 'Assigned', CURRENT_TIMESTAMP)"))
        
    state = tracking_service.ingest_gps_ping(
        shipment_id=shipment_id,
        lat=10.1,
        lng=20.1,
        speed=40.0,
        heading=90.0,
        actor_id="test-actor",
        actor_role="transporter"
    )
    
    assert state["lat"] == 10.1
    assert state["lng"] == 20.1
    
    with _engine().begin() as conn:
        row = conn.execute(text(f"SELECT lat, lng FROM shipments WHERE shipment_id = '{shipment_id}'")).first()
        assert row.lat == 10.1
        assert row.lng == 20.1

@pytest.mark.asyncio
async def test_rbac_unauthorized_access(async_client):
    retail_token = await get_token(async_client, "test_retail")
    
    # Retail shop trying to access admin endpoint
    resp = await async_client.get(
        "/api/admin/analytics",
        headers={"Authorization": f"Bearer {retail_token}"}
    )
    assert resp.status_code == 403
    assert "not allowed" in resp.text

@pytest.mark.asyncio
async def test_duplicate_receiving_protection(async_client):
    admin_token = await get_token(async_client, "test_admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create order first
    sku = f"SKU-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(text(f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) VALUES ('{sku}', 'Test', 100, 10.0, 100, 0, 0, 0, 0, CURRENT_TIMESTAMP)"))
        
    order_req = {
        "idempotency_key": uuid.uuid4().hex,
        "retailer_name": "Retail A",
        "retailer_email": "retail@test.com",
        "dealer_id": "test_dealer",
        "product_sku": sku,
        "quantity": 10
    }
    
    res = await async_client.post("/api/dealer/orders/retail", json=order_req, headers=headers)
    assert res.status_code == 200
    order_code = res.json()["data"]["order"]["order_code"]
    
    # Dealer confirms order
    await async_client.patch(f"/api/dealer/orders/{order_code}/confirm", headers=headers)
    
    # Manufacturer accepts
    await async_client.patch(f"/api/manufacturer/orders/{order_code}/accept", headers=headers)
    
    # Manually transition to transit for testing
    with _engine().begin() as conn:
        conn.execute(text(f"UPDATE orders SET current_stage = 'dealer_in_transit' WHERE order_code = '{order_code}'"))
    
    # Dealer receives
    recv_d = await async_client.patch(f"/api/dealer/orders/{order_code}/receive", json={"received_quantity": 10, "idempotency_key": uuid.uuid4().hex}, headers=headers)
    assert recv_d.status_code == 200
    
    # Retail receives
    recv_res1 = await async_client.patch(f"/api/dealer/orders/{order_code}/retail-receive", headers=headers)
    assert recv_res1.status_code == 200
    
    # Receive it again (should fail/block duplicate receiving)
    recv_res2 = await async_client.patch(f"/api/dealer/orders/{order_code}/retail-receive", headers=headers)
    assert recv_res2.status_code in (400, 422)
    assert "already" in recv_res2.text.lower() or "cannot" in recv_res2.text.lower() or "not in correct stage" in recv_res2.text.lower()
