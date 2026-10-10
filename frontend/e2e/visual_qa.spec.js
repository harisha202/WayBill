import { test, expect } from '@playwright/test';

test.describe('Visual QA & Authentication Screenshots', () => {
  test('Capture Homepage, Role Selection, and Login screens', async ({ page }) => {
    // 1. Homepage
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/01_homepage.png', fullPage: true });

    // 2. Role Selection
    await page.click('button:has-text("System Login")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/02_role_selection.png', fullPage: true });

    // 3. Login Screen (Manufacturer)
    const mfgCard = page.locator('.standard-role-card').filter({ hasText: /Manufacturer/i });
    if (await mfgCard.isVisible()) {
      await mfgCard.click();
    } else {
      await page.click('text=Manufacturer');
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/03_login_screen.png', fullPage: true });

    // 4. Forgot Password Modal
    const forgotBtn = page.locator('button:has-text("Forgot Password?")');
    if (await forgotBtn.isVisible()) {
      await forgotBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/04_forgot_password_modal.png', fullPage: true });

      // Request authorization test
      await page.fill('#forgot-email', 'manufacturer@globalsupply.com');
      await page.click('button:has-text("Request Authorization")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/05_recovery_requested_state.png', fullPage: true });
    }
  });

  test('Capture Role-Specific Dashboards', async ({ page }) => {
    // Helper login
    const login = async (roleText, username, company, email, password) => {
      await page.goto('http://127.0.0.1:5173/');
      await page.click('button:has-text("System Login")');
      await page.waitForTimeout(300);
      await page.locator('.standard-role-card').filter({ hasText: new RegExp(roleText, 'i') }).click();
      await page.fill('input[placeholder="Enter your username"]', username);
      await page.fill('input[placeholder="Enter company name"]', company);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    };

    // 1. Admin Control Tower & User Management
    await login('Admin', 'admin', 'WayBill HQ', 'admin@globalsupply.com', 'admin123');
    await page.screenshot({ path: 'e2e/screenshots/06_admin_control_tower.png', fullPage: true });

    await page.goto('http://127.0.0.1:5173/admin/users');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/07_admin_user_management.png', fullPage: true });

    // Open Admin reset OTP modal on a user
    const resetBtn = page.locator('button:has-text("Reset Password")').first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/08_admin_reset_otp_modal.png', fullPage: true });
    }

    // 2. Transporter Live Map
    await page.goto('http://127.0.0.1:5173/transporter/map');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/09_transporter_live_map.png', fullPage: true });

    // 3. Retail Dashboard
    await page.goto('http://127.0.0.1:5173/retail');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/10_retail_dashboard.png', fullPage: true });
  });
});
