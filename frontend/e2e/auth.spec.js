import { test, expect } from '@playwright/test';

const USERS = {
  admin: { username: 'admin', role: 'admin', email: 'admin@waybill.com', company: 'WayBill HQ', password: 'admin123', path: /\/admin/ },
  dealer: { username: 'dealer', role: 'dealer', email: 'dealer@waybill.com', company: 'Dealer LLC', password: 'dealer123', path: /\/dealer/ },
  retail_shop: { username: 'retail', role: 'retail_shop', email: 'retail@waybill.com', company: 'Retail Store', password: 'retail123', path: /\/retail/ },
  manufacturer: { username: 'maker', role: 'manufacturer', email: 'manufacturer@waybill.com', company: 'Maker Corp', password: 'maker123', path: /\/manufacturer/ },
  transporter: { username: 'transporter', role: 'transporter', email: 'transporter@waybill.com', company: 'Transit Inc', password: 'transit123', path: /\/transporter/ },
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
    await page.fill('input[placeholder="Enter company name"]', user.company);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(user.path, { timeout: 10000 });
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
