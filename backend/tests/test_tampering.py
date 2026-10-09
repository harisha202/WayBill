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
async def admin_headers():
    from app.api.auth import create_access_token
    from app.models.user import UserRole
    token = create_access_token(subject="admin@globalsupply.com", role=UserRole.admin)
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_waybill_tampering(async_client, admin_headers):
    # 1. Create a Waybill
    batch_id = f"BATCH-{uuid.uuid4().hex[:6]}"
    req_payload = {
        "idempotency_key": uuid.uuid4().hex,
        "batch_id": batch_id,
        "sku": "SKU-TEST-TAMPER",
        "quantity": 100,
        "initial_custodian": "Manufacturer Hub"
    }
    
    res = await async_client.post("/api/waybills/", json=req_payload, headers=admin_headers)
    assert res.status_code == 200, res.text
    waybill_data = res.json()["data"]
    waybill_id = waybill_data["waybill_id"]
    
    # 1.5 Seal the Waybill to generate seal_hash
    from app.services.waybill_service import waybill_service
    seal_res = waybill_service.seal_waybill(waybill_id, "admin-actor", "admin")
    qr_code = seal_res["qr_code"]
    seal_hash = seal_res["seal_hash"]
    
    # Verify initially valid
    verify_res1 = await async_client.post(
        f"/api/waybills/{waybill_id}/verify", 
        json={"idempotency_key": uuid.uuid4().hex, "seal_hash": seal_hash}, 
        headers=admin_headers
    )
    assert verify_res1.status_code == 200
    assert verify_res1.json()["data"]["valid"] is True

    # 2. Tamper with DB
    with _engine().begin() as conn:
        conn.execute(
            text(f"UPDATE custody_events SET quantity = 999 WHERE waybill_id = '{waybill_id}'")
        )
        
    # 3. Verify it is invalid
    verify_res2 = await async_client.post(
        f"/api/waybills/{waybill_id}/verify", 
        json={"idempotency_key": uuid.uuid4().hex, "seal_hash": seal_hash}, 
        headers=admin_headers
    )
    assert verify_res2.status_code == 200
    assert verify_res2.json()["data"]["valid"] is False

