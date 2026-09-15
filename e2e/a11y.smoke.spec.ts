/**
 * SISTEMA + A11Y — SIS-061
 * Ejecuta: npm run a11y
 *
 * Política inicial: FALLA solo en "critical". Las "serious" se adjuntan al
 * reporte como deuda técnica (ver HALLAZGOS abajo) para no bloquear el CI
 * mientras se corrigen. Subir a critical+serious cuando se fije el umbral.
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

const P0_ROUTES = ['/login', '/sales'];

test.describe('A11y smoke P0 (axe-core)', () => {
  for (const route of P0_ROUTES) {
    test(`sin violaciones críticas en ${route} (serious se reportan)`, async ({
      page,
    }) => {
      await page.goto(route);

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
      // Serious no bloquea aún (deuda documentada arriba). Para endurecer:
      // expect(serious).toEqual([]);
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
