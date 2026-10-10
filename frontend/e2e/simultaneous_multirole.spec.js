import { test, expect } from '@playwright/test';

test.describe('Phase M Multi-Role Simultaneous Acceptance Testing', () => {
  test('Simultaneous 5-Role Authenticated Browser Sessions & Workflow Transitions', async ({ browser }) => {
    // 1. Create 5 isolated browser contexts simulating 5 separate role sessions
    const adminContext = await browser.newContext();
    const mfgContext = await browser.newContext();
    const transContext = await browser.newContext();
    const dealerContext = await browser.newContext();
    const retailContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const mfgPage = await mfgContext.newPage();
    const transPage = await transContext.newPage();
    const dealerPage = await dealerContext.newPage();
    const retailPage = await retailContext.newPage();

    // Helper for role login
    const loginRole = async (page, role, username, company, email, password) => {
      await page.goto('http://127.0.0.1:5173/');
      await page.click('button:has-text("System Login")');
      await page.waitForTimeout(300);
      await page.locator('.standard-role-card').filter({ hasText: new RegExp(role, 'i') }).click();
      await page.fill('input[placeholder="Enter your username"]', username);
      await page.fill('input[placeholder="Enter company name"]', company);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    };

    // 2. Perform simultaneous logins across all 5 independent contexts
    await Promise.all([
      loginRole(adminPage, 'Admin', 'admin', 'Global Supply Corp', 'admin@globalsupply.com', 'admin123'),
      loginRole(mfgPage, 'Manufacturer', 'manufacturer', 'Global Supply Corp', 'manufacturer@globalsupply.com', 'testpass'),
      loginRole(transPage, 'Transporter', 'transporter', 'Global Supply Corp', 'transporter@globalsupply.com', 'testpass'),
      loginRole(dealerPage, 'Dealer', 'dealer', 'Dealer XYZ', 'dealer@waybill.com', 'testpass'),
      loginRole(retailPage, 'Retail Shop', 'retail', 'Global Supply Corp', 'retail@globalsupply.com', 'testpass'),
    ]);

    // 3. Verify that all 5 contexts are routed to their respective dashboards
    expect(adminPage.url()).toContain('/admin');
    expect(mfgPage.url()).toContain('/manufacturer');
    expect(transPage.url()).toContain('/transporter');
    expect(dealerPage.url()).toContain('/dealer');
    expect(retailPage.url()).toContain('/retail');

    // 4. Capture simultaneous dashboard screenshots
    await adminPage.screenshot({ path: 'e2e/screenshots/simultaneous_01_admin.png', fullPage: true });
    await mfgPage.screenshot({ path: 'e2e/screenshots/simultaneous_02_manufacturer.png', fullPage: true });
    await transPage.screenshot({ path: 'e2e/screenshots/simultaneous_03_transporter.png', fullPage: true });
    await dealerPage.screenshot({ path: 'e2e/screenshots/simultaneous_04_dealer.png', fullPage: true });
    await retailPage.screenshot({ path: 'e2e/screenshots/simultaneous_05_retail.png', fullPage: true });

    // 5. Transporter Live Map and QR Verification Screens
    await transPage.goto('http://127.0.0.1:5173/transporter/map');
    await transPage.waitForTimeout(1500);
    await transPage.screenshot({ path: 'e2e/screenshots/simultaneous_06_transporter_map.png', fullPage: true });

    await retailPage.goto('http://127.0.0.1:5173/retail/qr');
    await retailPage.waitForTimeout(1500);
    await retailPage.screenshot({ path: 'e2e/screenshots/simultaneous_07_retail_qr_verification.png', fullPage: true });

    // 6. Cross-role isolation check: verify that retail context cannot load admin user management
    const retailToken = await retailPage.evaluate(() => {
      const raw = localStorage.getItem('waybill_auth_state');
      if (raw) {
        try { return JSON.parse(raw).token; } catch (e) { return null; }
      }
      return null;
    });

    const res = await retailPage.request.get('http://127.0.0.1:8000/api/admin/users', {
      headers: retailToken ? { Authorization: `Bearer ${retailToken}` } : {}
    });
    expect([401, 403]).toContain(res.status());

    // 7. Cleanup contexts
    await adminContext.close();
    await mfgContext.close();
    await transContext.close();
    await dealerContext.close();
    await retailContext.close();
  });
});
