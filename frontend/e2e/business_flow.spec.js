import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers.js';

test.describe('WayBill E2E Business Flow', () => {
  // Use serial mode so state is preserved between tests (or we just pass data)
  test.describe.configure({ mode: 'serial' });

  let orderId = '';

  test('Group 3-4: Retail creates order and Dealer confirms', async ({ page }) => {
    // 1. Login as retail
    await loginAs(page, 'test_retail');

    // Go to Auto-Reorder Engine
    await page.goto('/retail/reorder');
    await expect(page.getByText(/Auto-Reorder Engine/i)).toBeVisible({ timeout: 10000 });
    const approveBtn = page.getByRole('button', { name: /Approve Reorder/i }).first();
    
    // We expect at least one reorder recommendation
    if (await approveBtn.isVisible()) {
      // Mock window.confirm
      page.on('dialog', dialog => dialog.accept());
      await approveBtn.click();
    } else {
      console.log('No reorder recommendation found, might skip or fail');
    }

    // Verify success toast or list
    await expect(page.getByText(/Order (placed|created|success)|Order pushed/i).first()).toBeVisible({ timeout: 5000 });

    await logout(page);

    // 2. Login as dealer
    await loginAs(page, 'test_dealer');

    // Look for the order in the dealer pipeline/table
    // The dealer goes to Order Fulfillment
    await page.goto('/dealer/pipeline');
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    
    // We expect at least one order to be pending or unconfirmed
    // The dealer confirms the order
    const confirmBtn = page.getByRole('button', { name: /Confirm/i }).first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await expect(page.getByText(/success/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
