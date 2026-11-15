/**
 * SISTEMA + A11Y — SIS-061
 * Ejecuta: npm run a11y
 *
 * Política (H-55): FALLA en "critical" y "serious"; el detalle de axe se adjunta al reporte.
 *
 * HALLAZGOS 2026-09-14 (login y sales, con mocks, sin backend):
 *  - aria-prohibited-attr (serious): toast-container usa aria-label en un div
 *    sin role. Fix: role="status" o mover aria-label a un region.
 *    Archivo: src/app/shared/ui/components/toast/toast-container.component.ts:13
 *  - color-contrast (serious): revisar pares de color en login (ver adjunto axe).
 *  - NG0600 en login.page.ts: effect escribe signals (toast) → el toast de error
 *    no siempre aparece. Fix: allowSignalWrites o queueMicrotask/untracked.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { loginAs } from './helpers/backend';

// Públicas: sin sesión. Privadas: con sesión de admin sembrada y API mockeada (Fase 6).
// Antes '/sales' sin sesión redirigía a /login y en realidad auditaba el login.
const PUBLIC_ROUTES = ['/login'];
const PRIVATE_ROUTES = ['/sales', '/branches', '/branch-pricing'];
const P0_ROUTES = [...PUBLIC_ROUTES, ...PRIVATE_ROUTES];

test.describe('A11y smoke P0 (axe-core)', () => {
  for (const route of P0_ROUTES) {
    test(`sin violaciones críticas ni serias en ${route}`, async ({
      page,
    }) => {
      if (PRIVATE_ROUTES.includes(route)) await loginAs(page, 'admin');
      await page.goto(route);
      if (PRIVATE_ROUTES.includes(route)) {
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        await expect(page.getByRole('main').first()).toBeVisible();
      }
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === 'critical',
      );
      const serious = results.violations.filter(
        (v) => v.impact === 'serious',
      );

      if (critical.length + serious.length > 0) {
        await test.info().attach(`axe-${route.replace('/', '') || 'root'}`, {
          body: JSON.stringify({ critical, serious }, null, 2),
          contentType: 'application/json',
        });
        console.log(
          `[A11Y ${route}] critical=${critical.map((v) => v.id).join(',') || '0'} serious=${serious.map((v) => v.id).join(',') || '0'}`,
        );
      }

      expect(
        critical,
        `Violaciones axe CRITICAL en ${route}: ${critical.map((v) => v.id).join(', ')}`,
      ).toEqual([]);
      // H-55: umbral endurecido a critical + serious.
      expect(
        serious,
        `Violaciones axe SERIOUS en ${route}: ${serious.map((v) => v.id).join(', ')}`,
      ).toEqual([]);
    });
  }

  test('login operable con teclado (tab + enter)', async ({ page }) => {
    await page.goto('/login');

    const userBox = page.getByRole('textbox', { name: 'Ingresa tu usuario' });
    await expect(userBox).toBeVisible({ timeout: 20_000 });
    await userBox.focus();
    await expect(userBox).toBeFocused();

    await page.keyboard.type('vendedor1');
    await page.keyboard.press('Tab');

    const passBox = page.getByRole('textbox', {
      name: 'Ingresa tu contraseña',
    });
    await expect(passBox).toBeFocused();
    await page.keyboard.type('secreta');

    const submit = page.getByRole('button', { name: 'Ingresar' });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();
  });
});
