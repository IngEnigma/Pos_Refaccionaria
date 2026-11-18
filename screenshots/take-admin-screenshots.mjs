import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4200';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pages = [
  ['admin-01-administracion', '/admin'],
  ['admin-02-sucursales', '/branches'],
  ['admin-03-precios-sucursal', '/branch-pricing'],
  ['admin-04-inventario-sucursal', '/inventory-by-branch'],
  ['admin-05-cajeros', '/manager/cashiers'],
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
await sleep(3000);
await page.click('#username');
await page.keyboard.type(process.env.U, { delay: 30 });
await page.click('#password');
await page.keyboard.type(process.env.P, { delay: 30 });
await page.keyboard.press('Enter');
try { await page.waitForFunction(() => !location.pathname.includes('login'), { timeout: 25000 }); }
catch { await page.screenshot({ path: path.join(dir, 'login-fail.png') }); console.log('LOGIN FAILED'); await browser.close(); process.exit(1); }
await sleep(3000);
for (const [name, route] of pages) {
  // SPA navigation keeps the in-memory session
  await page.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')); }, route);
  await sleep(8000);
  console.log(name, page.url());
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}
await browser.close();
