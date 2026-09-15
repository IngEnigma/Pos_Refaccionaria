/**
 * SMOKE contra backend REAL (Render) — SIS-001/SIS-013 en vivo.
 *
 * Se salta salvo que se pida explícito:
 *   E2E_REAL=1 npm run e2e -- auth.real
 *
 * Motivo: Render gratuito se duerme sin actividad y el login real tarda
 * 30-90s la primera vez (cold-start). El CI usa los specs con mocks
 * (auth.login.spec.ts); este archivo es para validación manual/nightly.
 *
 * Requiere que los usuarios de e2e/fixtures/test-users.ts existan en el
 * backend al que apunta el front (environment.ts → .../api).
 * Diagnóstico de fallos: 401 = falta seed en ese ambiente (crearlo vía
 * POST /api/users con id_sucursal, ver fixtures); 404 en /api/login/ =
 * el deploy no expone esa ruta (drift de versión, ver docs/plan-pruebas.md §11).
 */
import { test, expect, type Page } from '@playwright/test';

import { API_BASE } from './helpers/backend';
import { DEFAULT_REAL_USER, TEST_USERS } from './fixtures/test-users';

const REAL = process.env['E2E_REAL'] === '1';

/** Despierta a Render (hasta ~3 min). Devuelve false si no despertó. */
async function wakeRender(page: Page): Promise<boolean> {
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await page.request.get(API_BASE, { timeout: 60_000 });
      if (res.status() < 500) return true;
    } catch {
      /* Render aún dormido, reintenta */
    }
    await page.waitForTimeout(5_000);
  }
  return false;
}

test.describe('Auth REAL (Render, cold-start)', () => {
  test.skip(!REAL, 'Solo con E2E_REAL=1 (backend real, lento por cold-start)');
  test.slow();

  test('SIS-001 real: ana.centro hace login y llega a /sales', async ({
    page,
  }) => {
    test.skip(!(await wakeRender(page)), 'Render no despertó (cold-start)');
    await page.goto('/login');
    await page
      .getByRole('textbox', { name: 'Ingresa tu usuario' })
      .fill(DEFAULT_REAL_USER.username);
    await page
      .getByRole('textbox', { name: 'Ingresa tu contraseña' })
      .fill(DEFAULT_REAL_USER.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // Cold-start + JWT + perfil: hasta 60s la primera vez.
    await expect(page).toHaveURL(/sales/, { timeout: 60_000 });
  });

  test('SIS-013 real: usuario sin sucursal ve empty-state en /sales', async ({
    page,
  }) => {
    test.skip(!(await wakeRender(page)), 'Render no despertó (cold-start)');
    await page.goto('/login');
    await page
      .getByRole('textbox', { name: 'Ingresa tu usuario' })
      .fill(TEST_USERS.adminSinPerfil.username);
    await page
      .getByRole('textbox', { name: 'Ingresa tu contraseña' })
      .fill(TEST_USERS.adminSinPerfil.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/sales/, { timeout: 60_000 });
    await expect(
      page.getByText('Tu usuario no tiene sucursal asignada.'),
    ).toBeVisible({ timeout: 30_000 });
  });
});
