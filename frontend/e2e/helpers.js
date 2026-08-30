import { expect } from '@playwright/test';

export async function loginAs(page, username, company = 'HQ') {
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
