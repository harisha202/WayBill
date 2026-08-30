import { test, expect } from '@playwright/test';

async function loginAs(page, username, company = 'HQ') {
  await page.goto('/');
  await page.getByRole('button', { name: /Login/i }).click();
  let role = username.split('_')[1];
  if (role === 'mfg') role = 'manufacturer';
  if (role === 'trans') role = 'transporter';
  if (role === 'retail') role = 'retail shop';
  
  await page.locator('.standard-role-card').filter({ hasText: new RegExp(role, 'i') }).click();
  
  await page.fill('input[placeholder="Enter your username"]', username);
  await page.fill('input[placeholder="Enter company name"]', company);
  await page.fill('input[type="email"]', `${username.split('_')[1]}@test.com`);
  await page.fill('input[type="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/\/login/i, { timeout: 10000 });
}

test.describe('Dashboard Navigation E2E', () => {
  test('Dealer Dashboard loads tabs and charts', async ({ page }) => {
    await loginAs(page, 'test_dealer');
    // Check navigation / dashboard elements
    await expect(page.getByText(/Dealer Operations Hub/i).first()).toBeVisible({ timeout: 10000 });
    
    // Check charts (recharts uses SVG)
    await expect(page.locator('svg').first()).toBeVisible();
  });
});
