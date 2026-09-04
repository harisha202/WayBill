import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { loginAs, logout } from './helpers.js';

const backendDir = path.resolve(process.cwd(), '..', 'backend');

function runPython(script) {
  return execFileSync('python', ['-c', script], {
    cwd: backendDir,
    encoding: 'utf8',
  }).trim();
}

function arrangeLowStockProduct() {
  const sku = `E2E-REORDER-${Date.now()}`;
  runPython(`
from datetime import datetime, timezone
from app.services.database_service import _engine, products_table, stock_movements_table, reorder_events_table, orders_table, audit_logs_table

sku = ${JSON.stringify(sku)}
now = datetime.now(timezone.utc)
with _engine().begin() as conn:
    conn.execute(reorder_events_table.delete().where(reorder_events_table.c.sku == sku))
    conn.execute(audit_logs_table.delete().where(audit_logs_table.c.entity_id == sku))
    conn.execute(products_table.delete().where(products_table.c.sku == sku))
    conn.execute(products_table.insert().values(
        sku=sku,
        name='E2E Deterministic Reorder Product',
        quantity=100,
        price=25.0,
        reorder_point=20,
        reorder_policy='MANUAL_APPROVAL',
        safety_stock_qty=10,
        lead_time_days=3,
        available_stock=5,
        reserved_stock=0,
        in_transit=0,
        damaged=0,
        backordered=0,
        created_at=now,
    ))
    conn.execute(stock_movements_table.insert().values(
        movement_id='MOV-' + sku,
        sku=sku,
        quantity=30,
        movement_type='SALE',
        previous_quantity=35,
        new_quantity=5,
        reference_type='E2E_SETUP',
        reference_id=sku,
        user_id='e2e',
        created_at=now,
    ))
`);
  return sku;
}

function readReorderState(sku) {
  const output = runPython(`
import json
from app.services.database_service import _engine, products_table, reorder_events_table, orders_table, audit_logs_table, notifications_table
from sqlalchemy import select, func

sku = ${JSON.stringify(sku)}
with _engine().connect() as conn:
    product = conn.execute(select(products_table).where(products_table.c.sku == sku)).mappings().first()
    events = conn.execute(select(reorder_events_table).where(reorder_events_table.c.sku == sku)).mappings().all()
    order_codes = [row['order_id'] for row in events if row['order_id']]
    orders = []
    if order_codes:
        orders = conn.execute(select(orders_table).where(orders_table.c.order_code.in_(order_codes))).mappings().all()
    audits = conn.execute(select(audit_logs_table).where(audit_logs_table.c.entity_id == sku)).mappings().all()
    notifications = conn.execute(select(notifications_table).where(notifications_table.c.title == 'Reorder Approved')).mappings().all()
    print(json.dumps({
        'product': dict(product) if product else None,
        'events': [dict(row) for row in events],
        'orders': [dict(row) for row in orders],
        'auditActions': [row['action'] for row in audits],
        'notificationCount': len(notifications),
    }, default=str))
`);
  return JSON.parse(output);
}

test.describe('WayBill deterministic reorder business flow', () => {
  test('retail low-stock recommendation is approved through real UI and persists', async ({ page }) => {
    const sku = arrangeLowStockProduct();

    await loginAs(page, 'retail');
    await page.goto('/retail/reorder');
    await expect(page.getByText(/Auto-Reorder Engine/i)).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('Search records...').fill(sku);

    const row = page.locator('tr').filter({ hasText: sku });
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row).toContainText('E2E Deterministic Reorder Product');

    const suggestedQtyText = await row.locator('td').nth(3).innerText();
    const suggestedQty = Number(suggestedQtyText.replace(/[^0-9.-]/g, ''));
    expect(suggestedQty).toBeGreaterThan(0);

    page.on('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: /Approve/i }).click();
    await expect.poll(() => readReorderState(sku).events.length, { timeout: 10000 }).toBe(1);

    const state = readReorderState(sku);
    expect(state.product.available_stock).toBe(5);
    expect(state.events).toHaveLength(1);
    expect(state.events[0].status).toBe('APPROVED');
    expect(state.events[0].recommended_quantity).toBe(suggestedQty);
    expect(state.orders).toHaveLength(1);
    expect(state.orders[0].product_sku).toBe(sku);
    expect(state.orders[0].quantity).toBe(suggestedQty);
    expect(state.auditActions).toContain('APPROVE_REORDER');
    expect(state.notificationCount).toBeGreaterThan(0);
    await expect(row).toHaveCount(0, { timeout: 10000 });

    await logout(page);
    await loginAs(page, 'dealer');
    await page.goto('/dealer/pipeline');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    const dealerSearch = page.getByPlaceholder('Search records...');
    if (await dealerSearch.isVisible()) {
      await dealerSearch.fill(sku);
    }
    await expect(page.getByText(sku).first()).toBeVisible({ timeout: 10000 });
  });
});
