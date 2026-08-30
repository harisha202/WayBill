import { test, expect } from '@playwright/test';

const USERS = {
  admin: { username: 'test_admin', role: 'admin' },
  dealer: { username: 'test_dealer', role: 'dealer' },
  retail_shop: { username: 'test_retail', role: 'retail_shop' },
  manufacturer: { username: 'test_mfg', role: 'manufacturer' },
  transporter: { username: 'test_trans', role: 'transporter' },
};

// We will iterate through roles to verify successful login
for (const [key, user] of Object.entries(USERS)) {
  test(`should login successfully as ${key}`, async ({ page }) => {
    await page.goto('/');
    
    // Click login on homepage
    await page.getByRole('button', { name: /Login/i }).click();
    
    // Select role on role-selection screen (assuming button text contains role name)
    // The role selection probably has buttons for each role.
    await page.locator('.standard-role-card').filter({ hasText: new RegExp(user.role.replace('_', ' '), 'i') }).click();
    
    await page.fill('input[placeholder="Enter your username"]', user.username);
    await page.fill('input[placeholder="Enter company name"]', 'HQ');
    await page.fill('input[type="email"]', user.username.split('_')[1] + '@test.com');
    await page.fill('input[type="password"]', 'testpass');
    
    await page.click('button[type="submit"]');
    
    // Check if redirected to dashboard (or role-specific root like /admin, /dealer)
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 10000 });
  });
}

test('should show error on invalid credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Login/i }).click();
  await page.locator('.standard-role-card').filter({ hasText: /Admin/i }).click();
  
  await page.fill('input[placeholder="Enter your username"]', 'invalid_user');
  await page.fill('input[placeholder="Enter company name"]', 'HQ');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'wrongpass');
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/auth/login')),
    page.click('button[type="submit"]')
  ]);
  
  expect(response.status()).toBe(401);
});
