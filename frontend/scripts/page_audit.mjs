import { chromium } from '@playwright/test';

const BASE_URL = process.env.WAYBILL_BASE_URL || 'http://127.0.0.1:5173';

const users = {
  Admin: { username: 'admin', email: 'admin@waybill.com', password: 'admin123', company: 'WayBill HQ', roleText: /admin/i, root: '/admin' },
  Manufacturer: { username: 'maker', email: 'manufacturer@waybill.com', password: 'maker123', company: 'Maker Corp', roleText: /manufacturer/i, root: '/manufacturer' },
  Transporter: { username: 'transporter', email: 'transporter@waybill.com', password: 'transit123', company: 'Transit Inc', roleText: /transporter/i, root: '/transporter' },
  Dealer: { username: 'dealer', email: 'dealer@waybill.com', password: 'dealer123', company: 'Dealer LLC', roleText: /dealer/i, root: '/dealer' },
  RetailShop: { username: 'retail', email: 'retail@waybill.com', password: 'retail123', company: 'Retail Store', roleText: /retail shop/i, root: '/retail' },
};

const paths = {
  Admin: ['/admin', '/admin/users', '/admin/depth', '/admin/risk', '/admin/activity', '/admin/ledger', '/admin/alerts', '/admin/disputes', '/admin/verify', '/admin/batch', '/admin/settings'],
  Manufacturer: ['/manufacturer', '/manufacturer/production', '/manufacturer/forecast', '/manufacturer/sourcing', '/manufacturer/assurance', '/manufacturer/ledger', '/manufacturer/alerts', '/manufacturer/disputes', '/manufacturer/batch'],
  Transporter: ['/transporter', '/transporter/map', '/transporter/routes', '/transporter/fleet', '/transporter/logs', '/transporter/maintenance', '/transporter/ledger', '/transporter/alerts', '/transporter/disputes'],
  Dealer: ['/dealer', '/dealer/inventory', '/dealer/pipeline', '/dealer/network', '/dealer/ledger', '/dealer/alerts', '/dealer/disputes', '/dealer/batch'],
  RetailShop: ['/retail', '/retail/inventory', '/retail/pos', '/retail/qr', '/retail/reorder', '/retail/ledger', '/retail/alerts', '/retail/disputes', '/retail/verify', '/retail/batch'],
};

async function login(page, user) {
  await page.goto(BASE_URL);
  await page.getByRole('button', { name: /login/i }).click();
  await page.locator('.standard-role-card').filter({ hasText: user.roleText }).click();
  await page.fill('input[placeholder="Enter your username"]', user.username);
  await page.fill('input[placeholder="Enter company name"]', user.company);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/auth/login')),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(500);
  return response.status();
}

function classifyBody(text) {
  const lower = text.toLowerCase();
  return {
    homepage: lower.includes('connected supply chain operations'),
    login: lower.includes('enter your password') || lower.includes('system login'),
    error: lower.includes('error') || lower.includes('failed to load') || lower.includes('could not'),
    empty: lower.includes('no data') || lower.includes('no records') || lower.includes('unavailable') || lower.includes('insufficient'),
  };
}

async function auditPath(page, path) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const responses = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      responses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${BASE_URL}${path}`);
  await page.waitForTimeout(1200);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const boxes = await page.locator('svg, canvas, .leaflet-container, table').count().catch(() => 0);
  return {
    path,
    url: page.url(),
    title: bodyText.split('\n').find(Boolean) || '',
    boxes,
    flags: classifyBody(bodyText),
    apiErrors: responses,
    pageErrors: errors,
  };
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const [role, user] of Object.entries(users)) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 768 } });
  const page = await context.newPage();
  const loginStatus = await login(page, user);
  const authState = await page.evaluate(() => localStorage.getItem('gsc_auth_state'));
  results.push({ role, type: 'login', status: loginStatus, url: page.url(), authPresent: Boolean(authState) });
  for (const path of paths[role]) {
    results.push({ role, type: 'page', ...(await auditPath(page, path)) });
  }
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
