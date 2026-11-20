/**
 * `test` de Playwright que, con E2E_ELECTRON=1, cambia el fixture `page` por la ventana real de Electron
 * (electron/main.js + preload + IPC) cargando el ng serve del flujo. Sin la variable es el `test` normal.
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos:electron
 *
 * Las páginas extra creadas con `browser.newContext()` siguen siendo Chromium.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { _electron, test as base } from '@playwright/test';

export * from '@playwright/test';

export const IS_ELECTRON = process.env['E2E_ELECTRON'] === '1';

export const test = IS_ELECTRON
  ? base.extend({
      page: async ({ baseURL }, use, testInfo) => {
        // userData propio → localStorage limpio en cada prueba (como un contexto nuevo de Chromium)
        const userData = mkdtempSync(join(tmpdir(), 'trt-e2e-electron-'));
        const app = await _electron.launch({
          args: ['.'],
          env: { ...process.env, ELECTRON_START_URL: baseURL!, E2E_USER_DATA: userData },
        });
        try {
          const page = await app.firstWindow();
          // Electron no tiene baseURL: los specs usan goto('/ruta')
          const goto = page.goto.bind(page);
          page.goto = (url, opts) => goto(new URL(url, baseURL).href, opts);
          await use(page);
          if (testInfo.status !== testInfo.expectedStatus) {
            const body = await page.screenshot().catch(() => null);
            if (body) await testInfo.attach('screenshot-electron', { body, contentType: 'image/png' });
          }
        } finally {
          await app.close();
          rmSync(userData, { recursive: true, force: true });
        }
      },
    })
  : base;
