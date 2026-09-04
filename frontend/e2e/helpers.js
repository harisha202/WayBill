import { expect } from '@playwright/test';

export async function loginAs(page, username, company = 'HQ') {
  const defaults = {
    admin: { email: 'admin@waybill.com', password: 'admin123', company: 'WayBill HQ', role: /admin/i, path: /\/admin/ },
    maker: { email: 'manufacturer@waybill.com', password: 'maker123', company: 'Maker Corp', role: /manufacturer/i, path: /\/manufacturer/ },
    transporter: { email: 'transporter@waybill.com', password: 'transit123', company: 'Transit Inc', role: /transporter/i, path: /\/transporter/ },
    dealer: { email: 'dealer@waybill.com', password: 'dealer123', company: 'Dealer LLC', role: /dealer/i, path: /\/dealer/ },
    retail: { email: 'retail@waybill.com', password: 'retail123', company: 'Retail Store', role: /retail shop/i, path: /\/retail/ },
  };
  const account = defaults[username] || null;
  await page.goto('/');
  await page.getByRole('button', { name: /Login/i }).click();
  
  let role = account?.role;
  if (!role) {
    role = username.split('_')[1];
    if (role === 'mfg') role = 'manufacturer';
    if (role === 'trans') role = 'transporter';
    if (role === 'retail') role = 'retail shop';
    role = new RegExp(role, 'i');
  }
  
  await page.locator('.standard-role-card').filter({ hasText: role }).click();
  
  await page.fill('input[placeholder="Enter your username"]', username);
  await page.fill('input[placeholder="Enter company name"]', account?.company || company);
  await page.fill('input[type="email"]', account?.email || `${username.split('_')[1]}@test.com`);
  await page.fill('input[type="password"]', account?.password || 'testpass');
  await page.click('button[type="submit"]');
  
  if (account?.path) {
    await expect(page).toHaveURL(account.path, { timeout: 10000 });
  } else {
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 10000 });
  }
}

export async function logout(page) {
  // Find a logout button (usually bottom of sidebar)
  const logoutBtn = page.locator('button').filter({ hasText: /Logout|Sign out/i }).first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    // try finding the dropdown avatar or just force go to /login
    await page.goto('/login');
  }
}
