import { test } from '@playwright/test';

const ROLES = [
  { role: 'Admin', username: 'admin', company: 'Global Supply Corp', email: 'admin@globalsupply.com', password: 'admin123' },
  { role: 'Manufacturer', username: 'manufacturer', company: 'Global Supply Corp', email: 'manufacturer@globalsupply.com', password: 'testpass' },
  { role: 'Transporter', username: 'transporter', company: 'Global Supply Corp', email: 'transporter@globalsupply.com', password: 'testpass' },
  { role: 'Dealer', username: 'dealer', company: 'Dealer XYZ', email: 'dealer@waybill.com', password: 'testpass' },
  { role: 'RetailShop', username: 'retail', company: 'Global Supply Corp', email: 'retail@globalsupply.com', password: 'testpass', roleLabel: 'Retail Shop' }
];

const TABS = [
  // Admin
  { role: 'Admin', path: '/admin', id: 'admin_control_tower' },
  { role: 'Admin', path: '/admin/users', id: 'admin_users' },
  { role: 'Admin', path: '/admin/depth', id: 'admin_depth' },
  { role: 'Admin', path: '/admin/risk', id: 'admin_risk' },
  { role: 'Admin', path: '/admin/activity', id: 'admin_activity' },
  { role: 'Admin', path: '/admin/ledger', id: 'admin_ledger' },
  { role: 'Admin', path: '/admin/alerts', id: 'admin_alerts' },
  { role: 'Admin', path: '/admin/disputes', id: 'admin_disputes' },
  { role: 'Admin', path: '/admin/verify', id: 'admin_verify' },
  { role: 'Admin', path: '/admin/batch', id: 'admin_batch' },
  { role: 'Admin', path: '/admin/settings', id: 'admin_settings' },

  // Manufacturer
  { role: 'Manufacturer', path: '/manufacturer', id: 'mfg_dashboard' },
  { role: 'Manufacturer', path: '/manufacturer/production', id: 'mfg_production' },
  { role: 'Manufacturer', path: '/manufacturer/forecast', id: 'mfg_forecast' },
  { role: 'Manufacturer', path: '/manufacturer/sourcing', id: 'mfg_sourcing' },
  { role: 'Manufacturer', path: '/manufacturer/assurance', id: 'mfg_assurance' },
  { role: 'Manufacturer', path: '/manufacturer/ledger', id: 'mfg_ledger' },
  { role: 'Manufacturer', path: '/manufacturer/alerts', id: 'mfg_alerts' },
  { role: 'Manufacturer', path: '/manufacturer/disputes', id: 'mfg_disputes' },
  { role: 'Manufacturer', path: '/manufacturer/batch', id: 'mfg_batch' },

  // Transporter
  { role: 'Transporter', path: '/transporter', id: 'trans_dashboard' },
  { role: 'Transporter', path: '/transporter/map', id: 'trans_live_map' },
  { role: 'Transporter', path: '/transporter/routes', id: 'trans_routes' },
  { role: 'Transporter', path: '/transporter/fleet', id: 'trans_fleet' },
  { role: 'Transporter', path: '/transporter/logs', id: 'trans_logs' },
  { role: 'Transporter', path: '/transporter/maintenance', id: 'trans_maintenance' },
  { role: 'Transporter', path: '/transporter/ledger', id: 'trans_ledger' },
  { role: 'Transporter', path: '/transporter/alerts', id: 'trans_alerts' },
  { role: 'Transporter', path: '/transporter/disputes', id: 'trans_disputes' },

  // Dealer
  { role: 'Dealer', path: '/dealer', id: 'dealer_dashboard' },
  { role: 'Dealer', path: '/dealer/inventory', id: 'dealer_inventory' },
  { role: 'Dealer', path: '/dealer/pipeline', id: 'dealer_pipeline' },
  { role: 'Dealer', path: '/dealer/network', id: 'dealer_network' },
  { role: 'Dealer', path: '/dealer/ledger', id: 'dealer_ledger' },
  { role: 'Dealer', path: '/dealer/alerts', id: 'dealer_alerts' },
  { role: 'Dealer', path: '/dealer/disputes', id: 'dealer_disputes' },
  { role: 'Dealer', path: '/dealer/batch', id: 'dealer_batch' },

  // Retail Shop
  { role: 'RetailShop', path: '/retail', id: 'retail_dashboard' },
  { role: 'RetailShop', path: '/retail/inventory', id: 'retail_inventory' },
  { role: 'RetailShop', path: '/retail/pos', id: 'retail_pos' },
  { role: 'RetailShop', path: '/retail/qr', id: 'retail_qr' },
  { role: 'RetailShop', path: '/retail/reorder', id: 'retail_reorder' },
  { role: 'RetailShop', path: '/retail/ledger', id: 'retail_ledger' },
  { role: 'RetailShop', path: '/retail/alerts', id: 'retail_alerts' },
  { role: 'RetailShop', path: '/retail/disputes', id: 'retail_disputes' },
  { role: 'RetailShop', path: '/retail/verify', id: 'retail_verify' },
  { role: 'RetailShop', path: '/retail/batch', id: 'retail_batch' },
  { role: 'RetailShop', path: '/retail/receiving', id: 'retail_receiving' },
  { role: 'RetailShop', path: '/retail/waybills-shipments', id: 'retail_waybills' }
];

test.describe('Exhaustive 49-Tab Visual QA Screenshot Suite', () => {
  for (const r of ROLES) {
    test(`Capture all tabs for ${r.role}`, async ({ page }) => {
      // 1. Login
      await page.goto('http://127.0.0.1:5173/');
      await page.click('button:has-text("System Login")');
      await page.waitForTimeout(300);
      const roleSearch = r.roleLabel || r.role;
      await page.locator('.standard-role-card').filter({ hasText: new RegExp(roleSearch, 'i') }).click();
      await page.fill('input[placeholder="Enter your username"]', r.username);
      await page.fill('input[placeholder="Enter company name"]', r.company);
      await page.fill('input[type="email"]', r.email);
      await page.fill('input[type="password"]', r.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1500);

      // 2. Iterate each tab for this role
      const roleTabs = TABS.filter(t => t.role === r.role);
      for (const t of roleTabs) {
        await page.goto(`http://127.0.0.1:5173${t.path}`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `e2e/screenshots/tab_${t.id}.png`, fullPage: true });
      }
    });
  }
});
