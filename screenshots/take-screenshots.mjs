import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:4200';
const SCREENSHOTS_DIR = __dirname;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const screenshot = (page, name) =>
  page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
const waitForApi = (page, seconds) => {
  console.log(`  Waiting ${seconds}s for API...`);
  return sleep(seconds * 1000);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // ========== 1. LOGIN PAGE ==========
    console.log('1/9 - Login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);
    await screenshot(page, '01-login');
    console.log('  ✓ login page');

    // ========== LOGIN ACTION ==========
    console.log('Logging in...');
    await page.evaluate(() => {
      const u = document.querySelector('input[id="username"]');
      if (u) { u.value = 'Francisco Morales'; u.dispatchEvent(new Event('input', { bubbles: true })); }
      const p = document.querySelector('input[id="password"]');
      if (p) { p.value = '1234567'; p.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await sleep(500);
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect to /sales
    console.log('  Waiting for login API (up to 25s)...');
    for (let i = 0; i < 25; i++) {
      await sleep(1000);
      if (page.url().includes('/sales')) break;
    }
    console.log('  ✓ Logged in →', page.url());

    // ========== 2. SALES PAGE ==========
    console.log('2/9 - Sales page...');
    await waitForApi(page, 8);
    await screenshot(page, '02-sales');
    console.log('  ✓ sales page');

    // Navigate within SPA using Angular Router
    const spaNavigate = async (path) => {
      const success = await page.evaluate((routePath) => {
        const appRoot = document.querySelector('app-root');
        if (appRoot) {
          // Try Angular's router navigation through DOM click on sidebar link
          const link = document.querySelector(`a[routerlink="${routePath}"], a[routerlink="/${routePath}"]`);
          if (link) { link.click(); return 'sidebar'; }
        }
        // Fallback
        window.history.pushState({}, '', routePath.startsWith('/') ? routePath : `/${routePath}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return 'pushstate';
      }, path);
      return success;
    };

    // ========== 3. INVENTORY PAGE ==========
    console.log('3/9 - Inventory page...');
    await spaNavigate('/inventory');
    await waitForApi(page, 10);
    console.log('  URL:', page.url());
    await screenshot(page, '03-inventory');
    console.log('  ✓ inventory page');

    // ========== 4. PRODUCT FORM DIALOG ==========
    console.log('4/9 - Product form dialog...');
    const addProductBtn = await page.$('button.btn-add-product');
    if (addProductBtn) {
      await addProductBtn.click();
      await sleep(3000);
      await screenshot(page, '04-product-form-dialog');
      console.log('  ✓ product form dialog');
      const closeBtn = await page.$('button.btn-close');
      if (closeBtn) await closeBtn.click();
      await sleep(1500);
    } else {
      const btns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim().substring(0, 40),
          cls: b.className,
        }))
      );
      console.log('  - btn-add-product not found:', JSON.stringify(btns));
    }

    // ========== 5. SUPPLIERS PAGE ==========
    console.log('5/9 - Suppliers page...');
    await spaNavigate('/suppliers');
    await waitForApi(page, 10);
    console.log('  URL:', page.url());
    await screenshot(page, '05-suppliers');
    console.log('  ✓ suppliers page');

    // ========== 6. SUPPLIER FORM DIALOG ==========
    console.log('6/9 - Supplier form dialog...');
    const addSupplierBtn = await page.$('button.btn-add-supplier');
    if (addSupplierBtn) {
      await addSupplierBtn.click();
      await sleep(3000);
      await screenshot(page, '06-supplier-form-dialog');
      console.log('  ✓ supplier form dialog');
      const closeBtn = await page.$('button.btn-close');
      if (closeBtn) await closeBtn.click();
      await sleep(1500);
    } else {
      const btns = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim().substring(0, 40),
          cls: b.className,
        }))
      );
      console.log('  - btn-add-supplier not found:', JSON.stringify(btns));
    }

    // ========== 7. REPORTS PAGE ==========
    console.log('7/9 - Reports page...');
    await spaNavigate('/reports');
    await waitForApi(page, 10);
    console.log('  URL:', page.url());
    await screenshot(page, '07-reports');
    console.log('  ✓ reports page');

    // ========== 8. SALES HISTORY PAGE ==========
    console.log('8/9 - Sales history page...');
    await spaNavigate('/history');
    await waitForApi(page, 20);
    // Extra wait for skeleton to disappear
    try {
      await page.waitForFunction(() => {
        const skeletons = document.querySelectorAll('.skeleton, .animate-pulse, [class*="skeleton"], [class*="loading"]');
        return skeletons.length === 0;
      }, { timeout: 15000 });
      console.log('  Skeletons cleared');
    } catch {
      console.log('  Still waiting...');
      await sleep(5000);
    }
    console.log('  URL:', page.url());
    await screenshot(page, '08-sales-history');
    console.log('  ✓ sales history page');

    // ========== 9. SALE DETAIL MODAL ==========
    console.log('9/9 - Sale detail modal...');
    const detailBtns = await page.$$('td button, table button, .view-detail-btn, button[aria-label*="detalle" i]');
    if (detailBtns.length > 0) {
      await detailBtns[0].click();
      await waitForApi(page, 5);
      await screenshot(page, '09-sale-detail-modal');
      console.log('  ✓ sale detail modal');
    } else {
      const rows = await page.$$('tr[data-id], tr.clickable, tbody tr');
      if (rows.length > 1) {
        try { await rows[1].click(); } catch {}
        await waitForApi(page, 5);
        await screenshot(page, '09-sale-detail-modal');
        console.log('  ✓ sale detail modal (row click)');
      } else {
        console.log('  - No sale detail available, skipping');
      }
    }

    console.log('\n✅ All screenshots captured in /screenshots/');
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    await browser.close();
  }
})();
