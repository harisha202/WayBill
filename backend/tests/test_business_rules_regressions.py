from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from run import app
from app.core.security import hash_password
from app.services.database_service import _engine
from app.services.database_service import reorder_recommendations
from app.services.manufacturer_service import manufacturer_service


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture(autouse=True)
def setup_users():
    pw = hash_password("testpass")
    with _engine().begin() as conn:
        conn.execute(text("DELETE FROM users WHERE username IN ('rule_retail', 'rule_mfg')"))
        conn.execute(text(f"""
            INSERT INTO users (username, name, email, password_hash, role, company_name, is_active, failed_login_attempts, created_at) VALUES
            ('rule_retail', 'Retail', 'rule_retail@test.com', '{pw}', 'retail_shop', 'HQ', 1, 0, CURRENT_TIMESTAMP),
            ('rule_mfg', 'Manufacturer', 'rule_mfg@test.com', '{pw}', 'manufacturer', 'HQ', 1, 0, CURRENT_TIMESTAMP)
        """))
    yield


async def _token(client: AsyncClient, username: str, email: str) -> str:
    response = await client.post(
        "/api/auth/login",
        json={"username": username, "email": email, "company_name": "HQ", "password": "testpass"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


async def _default_retail_token(client: AsyncClient) -> str:
    response = await client.post(
        "/api/auth/login",
        json={
            "username": "rule_retail",
            "email": "rule_retail@test.com",
            "company_name": "HQ",
            "password": "testpass",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def test_qa_rejects_inspection_before_production_start_and_over_inspection():
    sku = f"SKU-QA-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(text(
            f"INSERT INTO products (sku, name, quantity, price, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
            f"VALUES ('{sku}', 'QA Rule Product', 0, 10.0, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP)"
        ))

    order = manufacturer_service.create_production_order(sku, 10, "rule_mfg@test.com", "manufacturer")

    with pytest.raises(ValueError, match="after production starts"):
        manufacturer_service.submit_qa(order["order_id"], 10, 0, None, None, "rule_mfg@test.com", "manufacturer")

    manufacturer_service.start_production(order["order_id"], "rule_mfg@test.com", "manufacturer")

    with pytest.raises(ValueError, match="cannot exceed"):
        manufacturer_service.submit_qa(order["order_id"], 11, 0, None, None, "rule_mfg@test.com", "manufacturer")


@pytest.mark.asyncio
async def test_retail_sale_does_not_create_automatic_reorder_order(async_client):
    sku = f"SKU-NOAUTO-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(text(
            f"INSERT INTO products (sku, name, quantity, price, reorder_point, safety_stock_qty, lead_time_days, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
            f"VALUES ('{sku}', 'No Auto Reorder Product', 10, 10.0, 9, 5, 3, 10, 0, 0, 0, 0, CURRENT_TIMESTAMP)"
        ))

    token = await _token(async_client, "rule_retail", "rule_retail@test.com")
    response = await async_client.post(
        "/api/inventory/sales",
        json={"sku": sku, "quantity": 2, "retailer_name": "Rule Retail", "payment_method": "cash"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200, response.text

    with _engine().connect() as conn:
        auto_orders = conn.execute(
            text("SELECT COUNT(*) FROM orders WHERE product_sku = :sku AND retailer_name = 'Auto-Reorder System'"),
            {"sku": sku},
        ).scalar()

    assert auto_orders == 0


def test_reorder_recommendation_uses_available_stock_and_ignores_healthy_stock():
    low_sku = f"SKU-LOW-{uuid.uuid4().hex[:6]}"
    healthy_sku = f"SKU-OK-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(text(
            f"INSERT INTO products (sku, name, quantity, price, reorder_point, safety_stock_qty, lead_time_days, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
            f"VALUES ('{low_sku}', 'Low Available Product', 100, 10.0, 20, 10, 3, 5, 0, 0, 0, 0, CURRENT_TIMESTAMP)"
        ))
        conn.execute(text(
            f"INSERT INTO products (sku, name, quantity, price, reorder_point, safety_stock_qty, lead_time_days, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
            f"VALUES ('{healthy_sku}', 'Healthy Product', 100, 10.0, 20, 10, 3, 50, 0, 0, 0, 0, CURRENT_TIMESTAMP)"
        ))

    recs = reorder_recommendations(days=30)
    rec_by_sku = {rec["sku"]: rec for rec in recs}

    assert low_sku in rec_by_sku
    assert rec_by_sku[low_sku]["currentStock"] == 5
    assert rec_by_sku[low_sku]["priority"] in {"critical", "high"}
    assert healthy_sku not in {sku for sku, rec in rec_by_sku.items() if rec["priority"] in {"critical", "high"}}


@pytest.mark.asyncio
async def test_reorder_approval_persists_audit_and_blocks_duplicate_without_stock_change(async_client):
    sku = f"SKU-APPROVE-{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(text(
            f"INSERT INTO products (sku, name, quantity, price, reorder_point, safety_stock_qty, lead_time_days, available_stock, reserved_stock, in_transit, damaged, backordered, created_at) "
            f"VALUES ('{sku}', 'Approval Product', 100, 10.0, 20, 10, 3, 5, 0, 0, 0, 0, CURRENT_TIMESTAMP)"
        ))

    token = await _default_retail_token(async_client)
    headers = {"Authorization": f"Bearer {token}"}

    rec_response = await async_client.get("/api/retail/reorder/recommendations", headers=headers)
    assert rec_response.status_code == 200, rec_response.text
    recs = rec_response.json()["data"]
    rec = next(item for item in recs if item["sku"] == sku)
    assert rec["recommended_qty"] > 0

    approval = await async_client.post(
        "/api/retail/reorder/approve",
        json={"sku": sku, "quantity": rec["recommended_qty"]},
        headers=headers,
    )
    assert approval.status_code == 200, approval.text

    duplicate = await async_client.post(
        "/api/retail/reorder/approve",
        json={"sku": sku, "quantity": rec["recommended_qty"]},
        headers=headers,
    )
    assert duplicate.status_code == 409

    with _engine().connect() as conn:
        product = conn.execute(text("SELECT available_stock FROM products WHERE sku = :sku"), {"sku": sku}).first()
        reorder_event = conn.execute(text("SELECT status, recommended_quantity, order_id FROM reorder_events WHERE sku = :sku"), {"sku": sku}).first()
        audit_count = conn.execute(text("SELECT COUNT(*) FROM audit_logs WHERE entity_id = :sku AND action = 'APPROVE_REORDER'"), {"sku": sku}).scalar()
        notification_count = conn.execute(text("SELECT COUNT(*) FROM notifications WHERE title = 'Reorder Approved'")).scalar()

    assert product.available_stock == 5
    assert reorder_event.status == "APPROVED"
    assert reorder_event.recommended_quantity == rec["recommended_qty"]
    assert reorder_event.order_id
    assert audit_count == 1
    assert notification_count >= 1

    rec_response_after = await async_client.get("/api/retail/reorder/recommendations", headers=headers)
    assert rec_response_after.status_code == 200
    assert sku not in {item["sku"] for item in rec_response_after.json()["data"]}
