# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business_flow.spec.js >> WayBill E2E Business Flow >> Group 3-4: Retail creates order and Dealer confirms
- Location: e2e\business_flow.spec.js:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Auto-Reorder Engine/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Auto-Reorder Engine/i)

```

```yaml
- main:
  - img "Waybill final logo mark"
  - heading "WAYBILL" [level=3]
  - heading "Connected Supply Chain Operations" [level=2]
  - paragraph:
    - strong: One connected supply chain. One operational view.
    - text: WayBill connects orders, inventory, manufacturing, transportation, waybills, traceability and financial operations into one platform.
  - button "System Login"
  - heading "Everything Connected in One Platform" [level=2]
  - heading "Real-Time Logistics" [level=3]
  - paragraph: Track shipments, vehicle movement, ETA and route risks.
  - heading "Inventory Control" [level=3]
  - paragraph: Monitor available, reserved, incoming stock, discrepancies and reorder requirements.
  - heading "Digital Waybills" [level=3]
  - paragraph: Manage waybill creation, sealing, dispatch, custody transfer, receiving and verification.
  - heading "QR Traceability" [level=3]
  - paragraph: Verify shipment and waybill identity using secure QR verification.
  - heading "Financial Traceability" [level=3]
  - paragraph: Connect financial transactions with orders, shipments, waybills and operational events.
  - heading "Operational Control" [level=3]
  - paragraph: Give each supply-chain participant the tools required for their role.
  - heading "One Connected Supply Chain" [level=3]
  - text: RETAIL SHOP → DEALER → MANUFACTURER → TRANSPORTER → DELIVERY / RECEIVING ORDER → INVENTORY → PRODUCTION → WAYBILL → TRANSPORT → GPS → RECEIVING → LEDGER → AUDIT
  - heading "Built for Every Supply Chain Role" [level=2]
  - heading "MANUFACTURER" [level=4]
  - paragraph: Manage production, demand, raw materials, quality and supplier operations.
  - heading "TRANSPORTER" [level=4]
  - paragraph: Manage vehicles, GPS tracking, ETA, routes, delays and shipment interventions.
  - heading "DEALER" [level=4]
  - paragraph: Manage orders, inventory, receiving, discrepancies, backorders and shipments.
  - heading "RETAIL SHOP" [level=4]
  - paragraph: Manage sales, inventory, incoming shipments, reorders and QR verification.
  - heading "From Business Event to Verified Record" [level=2]
  - text: Order ↓ Waybill ↓ Seal ↓ Dispatch ↓ Custody Transfer ↓ Transport ↓ Receiving ↓ Inventory ↓ Ledger ↓ Audit
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs, logout } from './helpers.js';
  3  | 
  4  | test.describe('WayBill E2E Business Flow', () => {
  5  |   // Use serial mode so state is preserved between tests (or we just pass data)
  6  |   test.describe.configure({ mode: 'serial' });
  7  | 
  8  |   let orderId = '';
  9  | 
  10 |   test('Group 3-4: Retail creates order and Dealer confirms', async ({ page }) => {
  11 |     // 1. Login as retail
  12 |     await loginAs(page, 'test_retail');
  13 | 
  14 |     // Go to Auto-Reorder Engine
  15 |     await page.goto('/retail/reorder');
> 16 |     await expect(page.getByText(/Auto-Reorder Engine/i)).toBeVisible({ timeout: 10000 });
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  17 |     const approveBtn = page.getByRole('button', { name: /Approve Reorder/i }).first();
  18 |     
  19 |     // We expect at least one reorder recommendation
  20 |     if (await approveBtn.isVisible()) {
  21 |       // Mock window.confirm
  22 |       page.on('dialog', dialog => dialog.accept());
  23 |       await approveBtn.click();
  24 |     } else {
  25 |       console.log('No reorder recommendation found, might skip or fail');
  26 |     }
  27 | 
  28 |     // Verify success toast or list
  29 |     await expect(page.getByText(/Order (placed|created|success)|Order pushed/i).first()).toBeVisible({ timeout: 5000 });
  30 | 
  31 |     await logout(page);
  32 | 
  33 |     // 2. Login as dealer
  34 |     await loginAs(page, 'test_dealer');
  35 | 
  36 |     // Look for the order in the dealer pipeline/table
  37 |     // The dealer goes to Order Fulfillment
  38 |     await page.goto('/dealer/pipeline');
  39 |     await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  40 |     
  41 |     // We expect at least one order to be pending or unconfirmed
  42 |     // The dealer confirms the order
  43 |     const confirmBtn = page.getByRole('button', { name: /Confirm/i }).first();
  44 |     if (await confirmBtn.isVisible()) {
  45 |       await confirmBtn.click();
  46 |       await expect(page.getByText(/success/i).first()).toBeVisible({ timeout: 5000 });
  47 |     }
  48 |   });
  49 | });
  50 | 
```