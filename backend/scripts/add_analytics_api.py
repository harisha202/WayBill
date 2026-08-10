import re

admin_path = r"c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\api\admin.py"
with open(admin_path, 'r') as f:
    content = f.read()

if "def get_revenue_cost" not in content:
    addition = """
@router.get("/analytics/revenue-cost")
def get_revenue_cost(payload: dict = Depends(require_roles(UserRole.admin))):
    with _engine().begin() as conn:
        from sqlalchemy import text
        # Mock calculation based on orders
        rows = conn.execute(text("SELECT strftime('%Y-%m', created_at) as month, SUM(price * quantity) as revenue FROM orders GROUP BY month ORDER BY month DESC LIMIT 6")).fetchall()
        
        data = []
        for r in reversed(rows):
            rev = r[1] or 0
            data.append({"month": r[0], "revenue": rev, "cost": rev * 0.7}) # Assuming 70% cost
        
        if not data:
            data = [{"month": "2024-01", "revenue": 10000, "cost": 7000}]
            
        return APIResponse(success=True, data=data)

@router.get("/analytics/order-pipeline")
def get_order_pipeline(payload: dict = Depends(require_roles(UserRole.admin))):
    with _engine().begin() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("SELECT status, COUNT(*) as count FROM orders GROUP BY status")).fetchall()
        data = [{"status": r[0], "count": r[1]} for r in rows]
        if not data:
            data = [{"status": "pending", "count": 0}]
        return APIResponse(success=True, data=data)
"""
    with open(admin_path, 'a') as f:
        f.write(addition)


dealer_path = r"c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\api\dealer.py"
with open(dealer_path, 'r') as f:
    content = f.read()

if "def get_backorder_trend" not in content:
    addition = """
@router.get("/analytics/backorders")
def get_backorder_trend(payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))):
    with _engine().begin() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as count FROM backorders GROUP BY day ORDER BY day DESC LIMIT 7")).fetchall()
        data = [{"day": r[0], "count": r[1]} for r in reversed(rows)]
        if not data:
            data = [{"day": "2024-01-01", "count": 0}]
        return APIResponse(success=True, data=data)

@router.get("/analytics/margin")
def get_margin(payload: dict = Depends(require_roles(UserRole.admin, UserRole.dealer))):
    with _engine().begin() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("SELECT strftime('%Y-%m', created_at) as month, SUM(price * quantity) as revenue FROM orders GROUP BY month ORDER BY month DESC LIMIT 6")).fetchall()
        data = []
        for r in reversed(rows):
            rev = r[1] or 0
            data.append({"month": r[0], "margin_pct": 30.0}) # Static 30% margin for demo since cost isn't strictly tracked in products table yet
        if not data:
            data = [{"month": "2024-01", "margin_pct": 30.0}]
        return APIResponse(success=True, data=data)
"""
    with open(dealer_path, 'a') as f:
        f.write(addition)


inv_path = r"c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\api\inventory.py"
with open(inv_path, 'r') as f:
    content = f.read()

if "def get_inventory_vs_reorder" not in content:
    addition = """
@router.get("/analytics/inventory-reorder")
def get_inventory_vs_reorder(payload: dict = Depends(require_roles(UserRole.admin, UserRole.retail_shop, UserRole.dealer))):
    with _engine().begin() as conn:
        from sqlalchemy import text
        rows = conn.execute(text("SELECT sku, available_stock FROM products LIMIT 5")).fetchall()
        data = [{"sku": r[0], "stock": r[1], "reorder_point": 50} for r in rows]
        if not data:
            data = [{"sku": "NONE", "stock": 0, "reorder_point": 50}]
        return APIResponse(success=True, data=data)
"""
    with open(inv_path, 'a') as f:
        f.write(addition)

print("Backend API routes added successfully.")
