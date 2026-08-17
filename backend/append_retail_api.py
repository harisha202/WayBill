import sys

code_to_add = """
# ─── RETAIL ANALYTICS ENDPOINTS ───────────────────────────────────────────────────

from app.services.database_service import (
    get_retail_dashboard_overview,
    get_retail_sales_pos_analytics,
    get_retail_inventory_analytics,
    get_retail_replenishment_analytics,
    get_retail_waybill_shipments,
    get_retail_qr_traceability,
    get_retail_receiving_analytics,
    get_retail_alerts_rag,
    get_retail_reports_analytics
)

@router.get("/analytics/dashboard")
def api_retail_dashboard(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_dashboard_overview(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/sales")
def api_retail_sales(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 180
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_sales_pos_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/inventory-detail")
def api_retail_inventory_analytics(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_inventory_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/replenishment")
def api_retail_replenishment(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_replenishment_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/waybills")
def api_retail_waybills(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_waybill_shipments(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/traceability")
def api_retail_traceability(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop))
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_qr_traceability(retailer)
    return APIResponse(success=True, data=data)

@router.get("/analytics/receiving")
def api_retail_receiving(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 90
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_receiving_analytics(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/alerts")
def api_retail_alerts(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 30
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_alerts_rag(retailer, days)
    return APIResponse(success=True, data=data)

@router.get("/analytics/reports")
def api_retail_reports(
    payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop)),
    days: int = 180
):
    retailer = payload.get("username", "retail") if payload.get("role") != "admin" else "retail"
    data = get_retail_reports_analytics(retailer, days)
    return APIResponse(success=True, data=data)
"""

with open(r'c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\api\retail.py', 'a', encoding='utf-8') as f:
    f.write(code_to_add)

print("Retail analytics endpoints added successfully.")
