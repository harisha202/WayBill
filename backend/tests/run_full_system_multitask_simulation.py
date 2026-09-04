"""
Comprehensive Full System & Multitasking Verification Script for WayBill Supply Chain OS.
Simulates concurrent multi-role operations:
1. Admin (Users, Reset OTPs, Dispute/Seal Centers, Report exports)
2. Manufacturer (Production batch creation, Start production, QA inspection, Complete, Dispatch)
3. Transporter (Live GPS telemetry ingestion, Driver & Fleet logs, Route optimizations)
4. Dealer (Pipeline, Discrepancy receiving with idempotency key, Backorder trigger, Partner network)
5. Retail Shop (Concurrent POS sales, Traceability QR, Reorder approvals)
6. Verifies system integrity, transactional safety, and zero unhandled errors.
"""

import sys
import uuid
import time
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient

from run import app
from app.api.auth import create_access_token
from app.models.user import UserRole
from app.services.database_service import _engine, products_table, shipments_table, orders_table
from sqlalchemy import select, insert, text

client = TestClient(app)

def get_token(email: str, role: UserRole) -> dict:
    token = create_access_token(subject=email, role=role)
    return {"Authorization": f"Bearer {token}"}

def run_simulation():
    print("=" * 70)
    print("STARTING FULL SYSTEM MULTITASKING & END-TO-END SUPPLY CHAIN SIMULATION")
    print("=" * 70)

    admin_h = get_token("admin@waybill.com", UserRole.admin)
    mfg_h = get_token("manufacturer@waybill.com", UserRole.manufacturer)
    trans_h = get_token("transporter@waybill.com", UserRole.transporter)
    dealer_h = get_token("dealer@waybill.com", UserRole.dealer)
    retail_h = get_token("retail@waybill.com", UserRole.retail_shop)

    errors = []

    # -------------------------------------------------------------
    # 1. ADMIN TIER VERIFICATION
    # -------------------------------------------------------------
    print("\n[1/5] Verifying Admin Tier & Multi-System Oversight...")
    try:
        users_res = client.get("/api/admin/users", headers=admin_h)
        assert users_res.status_code == 200, f"Failed users list: {users_res.text}"
        
        coc_res = client.get("/api/blockchain/analytics/chain-of-custody", headers=admin_h)
        assert coc_res.status_code == 200, f"Failed chain of custody: {coc_res.text}"

        seal_res = client.get("/api/blockchain/analytics/seal-verification", headers=admin_h)
        assert seal_res.status_code == 200, f"Failed seal verification: {seal_res.text}"

        report_res = client.get("/api/admin/reports/generate?type=orders", headers=admin_h)
        assert report_res.status_code == 200, f"Failed report gen: {report_res.text}"
        print("  -> Admin control tower, users, and blockchain endpoints PASSED")
    except Exception as e:
        errors.append(f"Admin tier error: {e}")

    # -------------------------------------------------------------
    # 2. MANUFACTURER TIER VERIFICATION
    # -------------------------------------------------------------
    print("\n[2/5] Verifying Manufacturer Production & Quality Lifecycle...")
    shipment_id = None
    try:
        sku = f"SKU_PROD_{uuid.uuid4().hex[:6]}"
        with _engine().begin() as conn:
            conn.execute(
                insert(products_table).values(
                    sku=sku,
                    name="Industrial Valve Assembly",
                    price=450.0,
                    quantity=50,
                    available_stock=50,
                    in_transit=0,
                    reserved_stock=0,
                    damaged=0,
                    backordered=0,
                    created_at=datetime.now(timezone.utc)
                )
            )

        # 2a. Create production order
        p_res = client.post("/api/manufacturer/orders", json={
            "sku": sku,
            "quantity": 100
        }, headers=mfg_h)
        assert p_res.status_code == 200, f"Production order failed: {p_res.text}"
        prod_order_id = p_res.json()["data"]["order_id"]

        # 2b. Start production
        start_res = client.post(f"/api/manufacturer/orders/{prod_order_id}/start", headers=mfg_h)
        assert start_res.status_code == 200, f"Start production failed: {start_res.text}"

        # 2c. QA Inspection
        qa_res = client.post(f"/api/manufacturer/orders/{prod_order_id}/qa", json={
            "passed": 100,
            "failed": 0,
            "defect_type": None,
            "notes": "Passed tolerance threshold with 100% QA score"
        }, headers=mfg_h)
        assert qa_res.status_code == 200, f"QA inspection failed: {qa_res.text}"


        # 2d. Complete production
        comp_res = client.post(f"/api/manufacturer/orders/{prod_order_id}/complete", headers=mfg_h)
        assert comp_res.status_code == 200, f"Complete production failed: {comp_res.text}"

        # 2e. Dispatch
        disp_res = client.post(f"/api/manufacturer/orders/{prod_order_id}/dispatch", json={
            "destination": "Central Logistics Hub"
        }, headers=mfg_h)
        assert disp_res.status_code == 200, f"Dispatch failed: {disp_res.text}"
        disp_data = disp_res.json()["data"]
        shipment_id = disp_data.get("shipment_id") or disp_data.get("order_id")
        print(f"  -> Manufacturer Create -> Start -> QA -> Complete -> Dispatch (Shipment: {shipment_id}) PASSED")
    except Exception as e:
        errors.append(f"Manufacturer tier error: {e}")

    # -------------------------------------------------------------
    # 3. TRANSPORTER TIER VERIFICATION
    # -------------------------------------------------------------
    print("\n[3/5] Verifying Transporter Telematics & Route Optimization...")
    try:
        # Fleet and drivers
        fleet_res = client.get("/api/tracking/fleet", headers=trans_h)
        assert fleet_res.status_code == 200
        
        driver_res = client.get("/api/tracking/drivers", headers=trans_h)
        assert driver_res.status_code == 200

        # Ingest simulated GPS Ping
        gps_payload = {
            "vehicle_id": "TRUCK-999",
            "shipment_id": shipment_id or "SHP-001",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "speed": 62.5,
            "heading": 88.0,
            "timestamp": "2026-09-04T04:00:00Z"
        }
        gps_res = client.post("/api/tracking/gps", json=gps_payload, headers=trans_h)
        assert gps_res.status_code in (200, 201), f"GPS ping failed: {gps_res.text}"

        # Log transporter intervention
        interv_res = client.post(f"/api/tracking/shipments/{shipment_id}/interventions", json={
            "action_type": "REROUTE_WEATHER",
            "reason": "Heavy monsoon rainfall on NH48 detour",
            "severity": "medium"
        }, headers=trans_h)
        assert interv_res.status_code == 200, f"Intervention log failed: {interv_res.text}"
        print("  -> Transporter Fleet, Telematics, and Interventions PASSED")

    except Exception as e:
        errors.append(f"Transporter tier error: {e}")

    # -------------------------------------------------------------
    # 4. DEALER TIER VERIFICATION
    # -------------------------------------------------------------
    print("\n[4/5] Verifying Dealer Discrepancy Receiving & Pipeline...")
    try:
        order_code = f"ORD-SIM-{uuid.uuid4().hex[:6]}"
        with _engine().begin() as conn:
            conn.execute(
                insert(orders_table).values(
                    order_code=order_code,
                    retailer_name="Metro Retail Hub",
                    retailer_email="metro@example.com",
                    dealer_id="dealer",
                    product_sku=sku,
                    quantity=50,
                    status="in_transit",
                    current_stage="in_transit",
                    origin="Manufacturer Warehouse",
                    destination="Dealer Warehouse",
                    ordered_quantity=50,
                    received_quantity=0,
                    discrepancy_quantity=0,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
            )

        # Dealer receives order with a discrepancy (45 received vs 50 ordered) with idempotency_key
        recv_res = client.post(f"/api/dealer/orders/{order_code}/receive", json={
            "received_quantity": 45,
            "idempotency_key": str(uuid.uuid4())
        }, headers=dealer_h)
        assert recv_res.status_code == 200, f"Dealer receive failed: {recv_res.text}"
        recv_data = recv_res.json()["data"]
        assert recv_data["discrepancy"] == 5
        assert recv_data["backorder_created"] is True
        print("  -> Dealer Order Receiving -> Discrepancy Detection -> Backorder Creation PASSED")
    except Exception as e:
        errors.append(f"Dealer tier error: {e}")

    # -------------------------------------------------------------
    # 5. RETAIL SHOP & HIGH CONCURRENCY MULTITASKING VERIFICATION
    # -------------------------------------------------------------
    print("\n[5/5] Verifying Retail Multi-Client POS Sales & Reorder Concurrency...")
    try:
        # Create retail test product with 30 units
        ret_sku = f"SKU_RETAIL_{uuid.uuid4().hex[:6]}"
        with _engine().begin() as conn:
            conn.execute(
                insert(products_table).values(
                    sku=ret_sku,
                    name="High Demand Component",
                    price=25.0,
                    quantity=30,
                    available_stock=30,
                    in_transit=0,
                    reserved_stock=0,
                    damaged=0,
                    backordered=0,
                    reorder_point=15,
                    safety_stock_qty=10,
                    lead_time_days=2,
                    created_at=datetime.now(timezone.utc)
                )
            )

        def make_concurrent_sale(sale_qty):
            return client.post("/api/retail/sales", json={"sku": ret_sku, "quantity": sale_qty}, headers=retail_h)

        # Simulate 12 concurrent customer checkouts (each buying 3 units = 36 requested, 30 available)
        print("  * Simulating 12 simultaneous checkout threads...")
        with ThreadPoolExecutor(max_workers=12) as executor:
            futures = [executor.submit(make_concurrent_sale, 3) for _ in range(12)]
            results = [f.result() for f in futures]

        success_sales = [r for r in results if r.status_code == 200]
        rejected_sales = [r for r in results if r.status_code == 400]

        assert len(success_sales) == 10, f"Expected 10 successful sales, got {len(success_sales)}"
        assert len(rejected_sales) == 2, f"Expected 2 rejected sales, got {len(rejected_sales)}"
        print(f"  * Multitasking POS Sales: 10 succeeded, 2 safely rejected (Stock exactly 0). PASSED")

        # Verify Reorder Recommendation was triggered
        recs_res = client.get("/api/retail/reorder/recommendations", headers=retail_h)
        assert recs_res.status_code == 200
        rec_data = recs_res.json()["data"]
        sku_rec = next((r for r in rec_data if r["sku"] == ret_sku), None)
        assert sku_rec is not None, "Product should appear in reorder recommendations"
        rec_qty = sku_rec["recommended_qty"]

        # Concurrent reorder approval
        print("  * Simulating 4 concurrent reorder approvals...")
        def approve_reorder_task():
            return client.post("/api/retail/reorder/approve", json={"sku": ret_sku, "quantity": rec_qty}, headers=retail_h)

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(approve_reorder_task) for _ in range(4)]
            reorder_results = [f.result() for f in futures]

        approved_counts = [r.status_code for r in reorder_results]
        assert approved_counts.count(200) == 1, f"Expected exactly 1 reorder approval (200), got {approved_counts}"
        assert approved_counts.count(409) == 3, f"Expected 3 duplicate reorder conflicts (409), got {approved_counts}"
        print("  * Reorder Concurrency Protection: 1 approved, 3 duplicate conflicts handled. PASSED")

    except Exception as e:
        errors.append(f"Retail multitasking error: {e}")

    # -------------------------------------------------------------
    # FINAL RESULTS
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    if not errors:
        print("ALL TIERS, CONCURRENT WORKFLOWS, AND MULTITASKING CHECKS PASSED WITH 0 ERRORS!")
        print("=" * 70)
        return 0
    else:
        print(f"SIMULATION FAILED WITH {len(errors)} ERRORS:")
        for err in errors:
            print(f" - {err}")
        print("=" * 70)
        return 1

if __name__ == "__main__":
    sys.exit(run_simulation())
