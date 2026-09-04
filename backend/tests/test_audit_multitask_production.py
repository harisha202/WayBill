import pytest
import uuid
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from run import app
from app.api.auth import create_access_token
from app.models.user import UserRole
from app.services.otp_service import OTPService
from app.services.database_service import _engine, products_table, orders_table
from sqlalchemy import select, insert, update

client = TestClient(app)

def get_auth_headers(email: str, role: UserRole):
    token = create_access_token(subject=email, role=role)
    return {"Authorization": f"Bearer {token}"}

# ==============================================================================
# 1. AUDIT: PASSWORD RECOVERY REQUEST -> ADMIN AUTHORIZATION & RESET FLOW
# ==============================================================================

def test_password_recovery_request_flow():
    unique = uuid.uuid4().hex[:6]
    dealer_email = f"dealer_{unique}@example.com"
    dealer_username = f"dealer_{unique}"
    
    # 1. Create a dealer user via admin
    create_payload = {
        "username": dealer_username,
        "password": "old_password_123",
        "full_name": "Test Dealer",
        "email": dealer_email,
        "role": UserRole.dealer.value,
        "company_name": "Dealer Hub LLC"
    }
    admin_headers = get_auth_headers("admin@waybill.com", UserRole.admin)
    res = client.post("/api/admin/users", json=create_payload, headers=admin_headers)
    assert res.status_code == 200, res.text
    user_id = res.json()["data"]["id"]

    # 2. Non-admin user requests password recovery
    req_res = client.post("/api/auth/forgot-password", json={
        "email": dealer_email,
        "username": dealer_username,
        "role": "dealer"
    })
    assert req_res.status_code == 200
    assert "Password recovery request submitted" in req_res.json()["message"]

    # 3. Admin accounts cannot request password recovery through standard route
    admin_req_res = client.post("/api/auth/forgot-password", json={
        "email": "admin@waybill.com",
        "role": "admin"
    })
    assert admin_req_res.status_code == 400

    # 4. Admin triggers OTP generation for the user
    otp_res = client.post(f"/api/admin/users/{user_id}/reset-password/send-otp", headers=admin_headers)
    assert otp_res.status_code == 200
    assert otp_res.json()["success"] is True

    # 5. Admin retrieves server-generated OTP to verify & resets password
    from app.services.otp_service import otp_storage
    assert dealer_email in otp_storage
    otp_code = otp_storage[dealer_email]["otp"]

    reset_res = client.post(
        f"/api/admin/users/{user_id}/reset-password",
        json={"otp": otp_code, "new_password": "NewSecretPassword123!"},
        headers=admin_headers
    )

    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 6. User can now login with the new password
    login_res = client.post("/api/auth/login", json={
        "username": dealer_username,
        "email": dealer_email,
        "company_name": "Dealer Hub LLC",
        "password": "NewSecretPassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

# ==============================================================================
# 2. AUDIT: CONCURRENCY & MULTITASKING SIMULATION
# ==============================================================================

from datetime import datetime, timezone

def test_concurrent_sales_inventory_safety():
    """Verify concurrent sales do not cause race conditions or negative inventory."""
    sku = f"SKU_CONC_{uuid.uuid4().hex[:6]}"
    initial_stock = 20
    
    with _engine().begin() as conn:
        conn.execute(
            insert(products_table).values(
                sku=sku,
                name="Concurrency Test Product",
                price=150.0,
                quantity=initial_stock,
                available_stock=initial_stock,
                in_transit=0,
                reserved_stock=0,
                damaged=0,
                backordered=0,
                created_at=datetime.now(timezone.utc)
            )
        )

    retail_headers = get_auth_headers("retail@waybill.com", UserRole.retail_shop)

    def make_sale(qty):
        return client.post("/api/retail/sales", json={"sku": sku, "quantity": qty}, headers=retail_headers)

    # 10 simultaneous threads each trying to sell 3 units (total 30 units requested, 20 available)
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_sale, 3) for _ in range(10)]
        results = [f.result() for f in futures]

    successes = [r for r in results if r.status_code == 200]
    failures = [r for r in results if r.status_code == 400]

    # Exactly 6 sales of 3 units (18 units) can succeed; the remaining 4 must fail due to insufficient stock
    assert len(successes) == 6
    assert len(failures) == 4

    # Verify database state has exactly 2 remaining stock
    with _engine().begin() as conn:
        prod = conn.execute(select(products_table).where(products_table.c.sku == sku)).first()
        assert prod.available_stock == 2
        assert prod.quantity == 2

def test_concurrent_duplicate_reorder_approval_prevention():
    """Verify duplicate simultaneous reorder approvals on the same SKU are prevented."""
    sku = f"SKU_REORDER_{uuid.uuid4().hex[:6]}"
    with _engine().begin() as conn:
        conn.execute(
            insert(products_table).values(
                sku=sku,
                name="Reorder Test Product",
                price=100.0,
                quantity=5,
                available_stock=5,
                in_transit=0,
                reserved_stock=0,
                damaged=0,
                backordered=0,
                created_at=datetime.now(timezone.utc)
            )
        )


    retail_headers = get_auth_headers("retail@waybill.com", UserRole.retail_shop)

    def approve_reorder():
        return client.post("/api/retail/reorder/approve", json={"sku": sku, "quantity": 50}, headers=retail_headers)

    # Trigger simultaneous reorders
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(approve_reorder) for _ in range(5)]
        results = [f.result() for f in futures]

    status_codes = [r.status_code for r in results]
    # Exactly one request creates the approved order; subsequent concurrent attempts get 409 Conflict
    assert 200 in status_codes
    assert status_codes.count(200) == 1

# ==============================================================================
# 3. AUDIT: BLOCKCHAIN & ANALYTICS ENDPOINTS INTEGRITY
# ==============================================================================

def test_blockchain_analytics_endpoints():
    admin_headers = get_auth_headers("admin@waybill.com", UserRole.admin)
    
    # Chain of custody
    coc_res = client.get("/api/blockchain/analytics/chain-of-custody", headers=admin_headers)
    assert coc_res.status_code == 200
    assert coc_res.json()["success"] is True

    # Seal verification
    seal_res = client.get("/api/blockchain/analytics/seal-verification", headers=admin_headers)
    assert seal_res.status_code == 200
    assert seal_res.json()["success"] is True

    # QR rate
    qr_res = client.get("/api/blockchain/analytics/qr-verification-rate", headers=admin_headers)
    assert qr_res.status_code == 200
    assert "success_rate" in qr_res.json()["data"]

# ==============================================================================
# 4. AUDIT: MULTI-ROLE EXPORT ENDPOINTS WITH VALID PATTERN QUERIES
# ==============================================================================

def test_analytics_reports_export():
    admin_headers = get_auth_headers("admin@waybill.com", UserRole.admin)
    dealer_headers = get_auth_headers("dealer@waybill.com", UserRole.dealer)
    transporter_headers = get_auth_headers("transporter@waybill.com", UserRole.transporter)
    retail_headers = get_auth_headers("retail@waybill.com", UserRole.retail_shop)

    # Admin reports
    assert client.get("/api/admin/reports/generate?type=orders", headers=admin_headers).status_code == 200
    assert client.get("/api/admin/reports/generate?type=inventory", headers=admin_headers).status_code == 200

    # Dealer reports
    assert client.get("/api/dealer/reports/export?type=orders", headers=dealer_headers).status_code == 200
    assert client.get("/api/dealer/reports/export?type=inventory", headers=dealer_headers).status_code == 200

    # Transporter reports
    assert client.get("/api/tracking/reports/export?type=shipments", headers=transporter_headers).status_code == 200

    # Retail reports
    assert client.get("/api/retail/reports/export?type=sales", headers=retail_headers).status_code == 200
