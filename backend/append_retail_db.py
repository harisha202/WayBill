import sys

code_to_add = """

# ─── RETAIL SHOP ANALYTICS ────────────────────────────────────────────────────────

def get_retail_dashboard_overview(retailer_name: str, days: int = 30) -> dict:
    \"\"\"1. Dashboard / Overview\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Sales + Revenue Line/Area (Daily)
        stmt1 = (
            select(
                func.date(sales_history_table.c.sold_at).label('day'),
                func.sum(sales_history_table.c.units_sold).label('sales'),
                func.sum(sales_history_table.c.sale_amount).label('revenue')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('day')
            .order_by('day')
        )
        trend = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Product Sales Column & Revenue Donut
        stmt2 = (
            select(
                sales_history_table.c.sku,
                func.sum(sales_history_table.c.units_sold).label('sales'),
                func.sum(sales_history_table.c.sale_amount).label('revenue')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by(sales_history_table.c.sku)
            .order_by(desc('revenue'))
            .limit(10)
        )
        product_perf = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        return {
            \"trend\": trend,
            \"productSales\": [{\"sku\": p[\"sku\"], \"sales\": p[\"sales\"]} for p in product_perf],
            \"productRevenue\": [{\"sku\": p[\"sku\"], \"revenue\": p[\"revenue\"]} for p in product_perf],
            \"totalRevenue\": sum(p[\"revenue\"] for p in product_perf)
        }

def get_retail_sales_pos_analytics(retailer_name: str, days: int = 180) -> dict:
    \"\"\"2. Sales / POS\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Monthly Volume (Main)
        stmt1 = (
            select(
                func.strftime('%Y-%m', sales_history_table.c.sold_at).label('month'),
                func.sum(sales_history_table.c.units_sold).label('volume'),
                func.sum(sales_history_table.c.sale_amount).label('revenue')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('month')
            .order_by('month')
        )
        monthly = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Quantity over time (Supp 1)
        stmt2 = (
            select(
                func.date(sales_history_table.c.sold_at).label('day'),
                func.sum(sales_history_table.c.units_sold).label('qty')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('day')
            .order_by('day')
        )
        daily_qty = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        # Scatter (Qty vs Revenue per transaction) (Supp 2)
        stmt3 = (
            select(sales_history_table.c.units_sold, sales_history_table.c.sale_amount, sales_history_table.c.sku)
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .limit(300)
        )
        scatter = [{\"qty\": r[0], \"revenue\": r[1], \"sku\": r[2]} for r in conn.execute(stmt3).fetchall()]
        
        return {\"monthly\": monthly, \"dailyQty\": daily_qty, \"scatter\": scatter}

def get_retail_inventory_analytics(retailer_name: str, days: int = 30) -> dict:
    \"\"\"3. Inventory\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Stock In vs Out Stacked (Main) - we infer 'retailer' from actor role or we just show global for now
        # Realistically retail inventory is global in our simple schema. We filter by role if available, or just global movements.
        stmt1 = (
            select(
                func.date(stock_movements_table.c.created_at).label('day'),
                func.sum(case((stock_movements_table.c.movement_type.in_(['IN', 'RECEIVE']), stock_movements_table.c.quantity), else_=0)).label('stockIn'),
                func.sum(case((stock_movements_table.c.movement_type.in_(['OUT', 'SALE', 'SALE_RETAIL']), func.abs(stock_movements_table.c.quantity)), else_=0)).label('stockOut')
            )
            .where(stock_movements_table.c.created_at >= since)
            .group_by('day')
            .order_by('day')
        )
        in_out = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Inventory Level over time (Supp 1) - approximate from movements
        stmt2 = (
            select(
                func.date(stock_movements_table.c.created_at).label('day'),
                func.avg(stock_movements_table.c.new_quantity).label('level')
            )
            .where(stock_movements_table.c.created_at >= since)
            .group_by('day')
            .order_by('day')
        )
        level_trend = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        # Low Stock (Supp 2)
        stmt3 = (
            select(products_table.c.sku, products_table.c.available_stock, products_table.c.reorder_point, products_table.c.safety_stock_qty)
            .where(products_table.c.available_stock <= products_table.c.reorder_point)
            .limit(20)
        )
        low_stock = [{\"sku\": r[0], \"current\": r[1], \"reorder\": r[2], \"safety\": r[3] or 0} for r in conn.execute(stmt3).fetchall()]
        
        return {\"inOut\": in_out, \"levelTrend\": level_trend, \"lowStock\": low_stock}

def get_retail_replenishment_analytics(retailer_name: str, days: int = 90) -> dict:
    \"\"\"4. Replenishment / Orders\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Demand Trend (Main)
        stmt1 = (
            select(
                func.date(sales_history_table.c.sold_at).label('day'),
                func.sum(sales_history_table.c.units_sold).label('demand')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('day')
            .order_by('day')
        )
        demand = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Reorder required (Supp 1)
        stmt2 = (
            select(products_table.c.sku, products_table.c.available_stock, products_table.c.reorder_point)
            .where(products_table.c.available_stock <= products_table.c.reorder_point)
            .limit(15)
        )
        reorders = [{\"sku\": r[0], \"stock\": r[1], \"reorderPoint\": r[2]} for r in conn.execute(stmt2).fetchall()]
        
        return {\"demand\": demand, \"reorders\": reorders}

def get_retail_waybill_shipments(retailer_name: str, days: int = 90) -> dict:
    \"\"\"5. Waybills / Shipments\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Shipment Lifecycle (Main) - Orders destined for Retail
        stmt1 = (
            select(orders_table.c.current_stage, func.count().label('count'))
            .where(orders_table.c.retailer_name == retailer_name)
            .where(orders_table.c.created_at >= since)
            .group_by(orders_table.c.current_stage)
        )
        stages = dict(conn.execute(stmt1).fetchall())
        pipeline = [
            {\"stage\": \"Created\", \"count\": stages.get(\"retail_ordered\", 0)},
            {\"stage\": \"Confirmed\", \"count\": stages.get(\"dealer_confirmed\", 0)},
            {\"stage\": \"Dispatched\", \"count\": stages.get(\"dispatched\", 0)},
            {\"stage\": \"In Transit\", \"count\": stages.get(\"in_transit\", 0)},
            {\"stage\": \"Delivered\", \"count\": stages.get(\"dealer_received\", 0)},
            {\"stage\": \"Received\", \"count\": stages.get(\"retail_received\", 0)},
        ]
        
        # Incoming Volume (Supp 1)
        stmt2 = (
            select(func.date(orders_table.c.created_at).label('day'), func.count().label('vol'))
            .where(orders_table.c.retailer_name == retailer_name)
            .where(orders_table.c.created_at >= since)
            .group_by('day')
            .order_by('day')
        )
        incoming = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        # Risk / Status (Supp 2) - Join orders with shipments
        stmt3 = (
            select(shipments_table.c.status, func.count().label('count'))
            .select_from(orders_table.join(shipments_table, orders_table.c.shipment_id == shipments_table.c.shipment_id))
            .where(orders_table.c.retailer_name == retailer_name)
            .group_by(shipments_table.c.status)
        )
        risk_dist = [dict(r) for r in conn.execute(stmt3).mappings().all()]
        
        return {\"lifecycle\": pipeline, \"incoming\": incoming, \"riskDist\": risk_dist}

def get_retail_qr_traceability(retailer_name: str) -> dict:
    \"\"\"6. QR / Traceability\"\"\"
    with _engine().begin() as conn:
        # Sankey Trace (Main) - Orders -> Batches -> Waybills
        stmt1 = (
            select(orders_table.c.manufacturer_id, orders_table.c.transporter_id, orders_table.c.retailer_name, orders_table.c.quantity)
            .where(orders_table.c.retailer_name == retailer_name)
            .where(orders_table.c.manufacturer_id.isnot(None))
            .limit(100)
        )
        raw_links = conn.execute(stmt1).fetchall()
        links = []
        for r in raw_links:
            mfg, trans, ret, qty = r[0], r[1] or \"Transporter\", r[2], r[3]
            links.append({\"source\": str(mfg), \"target\": \"Batch\", \"value\": qty, \"type\": \"mfg\"})
            links.append({\"source\": \"Batch\", \"target\": \"Waybill\", \"value\": qty, \"type\": \"batch\"})
            links.append({\"source\": \"Waybill\", \"target\": str(trans), \"value\": qty, \"type\": \"trans\"})
            links.append({\"source\": str(trans), \"target\": \"Dealer\", \"value\": qty, \"type\": \"trans\"})
            links.append({\"source\": \"Dealer\", \"target\": str(ret), \"value\": qty, \"type\": \"ret\"})
            
        # Custody Timeline (Supp 1)
        stmt2 = (
            select(custody_events_table)
            .order_by(desc(custody_events_table.c.created_at))
            .limit(20)
        )
        timeline = []
        for r in conn.execute(stmt2).mappings().all():
            d = dict(r)
            d['created_at'] = d['created_at'].isoformat() if d['created_at'] else None
            timeline.append(d)
        
        # Batch Status (Supp 2)
        stmt3 = select(batches_table.c.status, func.count().label('count')).group_by(batches_table.c.status)
        batch_status = [dict(r) for r in conn.execute(stmt3).mappings().all()]
        
        return {\"sankey\": links, \"timeline\": timeline, \"batchStatus\": batch_status}

def get_retail_receiving_analytics(retailer_name: str, days: int = 90) -> dict:
    \"\"\"7. Receiving\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Ordered vs Received (Main)
        stmt1 = (
            select(
                orders_table.c.order_code,
                orders_table.c.ordered_quantity,
                orders_table.c.received_quantity
            )
            .where(orders_table.c.retailer_name == retailer_name)
            .where(orders_table.c.status.in_(['DELIVERED', 'PARTIALLY_DELIVERED', 'RECEIVED', 'RETAIL_RECEIVED']))
            .where(orders_table.c.updated_at >= since)
            .limit(30)
        )
        ord_vs_rec = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Variance Waterfall (Supp 1)
        variance = []
        for row in ord_vs_rec:
            diff = row['received_quantity'] - row['ordered_quantity']
            variance.append({\"order\": row['order_code'], \"variance\": diff})
            
        # Receiving Status Donut (Supp 2)
        stmt3 = (
            select(orders_table.c.status, func.count().label('count'))
            .where(orders_table.c.retailer_name == retailer_name)
            .where(orders_table.c.status.in_(['DELIVERED', 'PARTIALLY_DELIVERED', 'RECEIVED', 'RETAIL_RECEIVED']))
            .group_by(orders_table.c.status)
        )
        status_dist = [dict(r) for r in conn.execute(stmt3).mappings().all()]
        
        return {\"ordVsRec\": ord_vs_rec, \"variance\": variance, \"statusDist\": status_dist}

def get_retail_alerts_rag(retailer_name: str, days: int = 30) -> dict:
    \"\"\"8. Alerts / RAG\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Severity Bar (Main)
        stmt1 = (
            select(anomalies_table.c.severity, func.count().label('count'))
            .where(anomalies_table.c.created_at >= since)
            .group_by(anomalies_table.c.severity)
        )
        severity = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Alerts over time (Supp 1)
        stmt2 = (
            select(func.date(anomalies_table.c.created_at).label('day'), func.count().label('count'))
            .where(anomalies_table.c.created_at >= since)
            .group_by('day')
            .order_by('day')
        )
        trend = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        # Status Donut (Supp 2)
        stmt3 = (
            select(anomalies_table.c.status, func.count().label('count'))
            .where(anomalies_table.c.created_at >= since)
            .group_by(anomalies_table.c.status)
        )
        status = [dict(r) for r in conn.execute(stmt3).mappings().all()]
        
        return {\"severity\": severity, \"trend\": trend, \"status\": status}

def get_retail_reports_analytics(retailer_name: str, days: int = 180) -> dict:
    \"\"\"9. Reports / Analytics\"\"\"
    with _engine().begin() as conn:
        since = _utc_now() - timedelta(days=days)
        # Inv + Sales (Main)
        stmt1 = (
            select(
                func.strftime('%Y-%m', sales_history_table.c.sold_at).label('month'),
                func.sum(sales_history_table.c.units_sold).label('sales')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('month')
            .order_by('month')
        )
        perf = [dict(r) for r in conn.execute(stmt1).mappings().all()]
        
        # Revenue trend (Supp 1)
        stmt2 = (
            select(
                func.date(sales_history_table.c.sold_at).label('day'),
                func.sum(sales_history_table.c.sale_amount).label('revenue')
            )
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by('day')
            .order_by('day')
        )
        rev_trend = [dict(r) for r in conn.execute(stmt2).mappings().all()]
        
        # Product Perf Bar (Supp 2)
        stmt3 = (
            select(sales_history_table.c.sku, func.sum(sales_history_table.c.sale_amount).label('revenue'))
            .where(sales_history_table.c.retailer_name == retailer_name)
            .where(sales_history_table.c.sold_at >= since)
            .group_by(sales_history_table.c.sku)
            .order_by(desc('revenue'))
            .limit(15)
        )
        prod_perf = [dict(r) for r in conn.execute(stmt3).mappings().all()]
        
        return {\"perf\": perf, \"revTrend\": rev_trend, \"prodPerf\": prod_perf}
"""

with open(r'c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\services\database_service.py', 'a', encoding='utf-8') as f:
    f.write(code_to_add)

print("Retail analytics methods added successfully.")
