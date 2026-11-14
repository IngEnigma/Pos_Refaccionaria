/**
 * SISTEMA E2E — Sesión (SIS-004, SIS-005, SIS-006). Todo con mocks (page.route), sin Render.
 *
 * La sesión vive en memoria y solo se persiste en localStorage si se pidió "recordar"
 * (la UI no ofrece esa casilla: H-19), por eso SIS-005 siembra el localStorage con `seedSession`.
 */
import { test, expect } from '@playwright/test';

import { loginAs, mockApi, mockLoginAs } from './helpers/backend';

test.describe('Auth — sesión', () => {
  test('SIS-004 sin sesión, una ruta privada redirige a /login conservando redirectTo', async ({ page }) => {
    await mockLoginAs(page, 'seller');
    await page.goto('/history');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fhistory/);
  });

  test('SIS-004 tras iniciar sesión vuelve a la ruta privada que se pidió', async ({ page }) => {
    await mockLoginAs(page, 'seller');
    await page.goto('/history');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill('vendedor1');
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill('secreta');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/history$/);
  });

  test('SIS-005 la sesión recordada sobrevive a recargar la página', async ({ page }) => {
    await loginAs(page, 'seller', 'vendedor1');
    await page.goto('/sales');
    await expect(page.getByText('vendedor1', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/sales$/);
    await expect(page.getByText('vendedor1', { exact: true })).toBeVisible();
  });

  test('SIS-005 sin "recordar", recargar pierde la sesión y manda a /login', async ({ page }) => {
    await mockLoginAs(page, 'seller');
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill('vendedor1');
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill('secreta');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/sales$/);

    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test('SIS-005 un 401 renueva el access token con el refresh y reintenta la petición', async ({ page }) => {
    await loginAs(page, 'seller');
    // Mismo recurso: primero 401 con el token viejo, luego 200 con el token renovado.
    let perfilCalls = 0;
    const perfilAuth: (string | undefined)[] = [];
    await page.route(/refaccionariaback\.onrender\.com\/api\/perfil\/?$/, async (route) => {
      perfilCalls += 1;
      perfilAuth.push(route.request().headers()['authorization']);
      if (perfilCalls === 1) {
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"expired"}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, id_usuario: 1, id_sucursal: 1 }),
      });
    });
    const refresh = await mockApi(page, '/token/refresh', { access: 'nuevo.access' }, 200, 'POST');

    await page.goto('/sales');

    await expect.poll(() => perfilCalls).toBe(2);
    expect(refresh).toHaveLength(1);
    expect(refresh[0].body).toEqual({ refresh: 'e2e.refresh' });
    expect(refresh[0].headers['authorization']).toBeUndefined();
    expect(perfilAuth).toEqual(['Bearer e2e.access', 'Bearer nuevo.access']);
    await expect(page).toHaveURL(/\/sales$/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('session') ?? 'null'));
    expect(stored.accessToken).toBe('nuevo.access');
  });

  test('SIS-005 si el refresh falla se borra la sesión guardada', async ({ page }) => {
    await loginAs(page, 'seller');
    await mockApi(page, '/perfil', { detail: 'expired' }, 401);
    await mockApi(page, '/token/refresh', { detail: 'refresh inválido' }, 401, 'POST');

    await page.goto('/sales');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('session')))
      .toBeNull();
    // Sin sesión, la siguiente navegación privada pasa por el guard.
    await page.goto('/history');
    await expect(page).toHaveURL(/\/login/);
  });

  test('SIS-006 cerrar sesión limpia el almacenamiento y bloquea las rutas privadas', async ({ page }) => {
    await loginAs(page, 'seller');
    await page.goto('/sales');
    await expect(page.getByText('seller1', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Perfil' }).click();
    await page.getByText('Cerrar sesión').click();

    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('session'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('session:remember'))).toBeNull();

    await page.goto('/sales');
    await expect(page).toHaveURL(/\/login/);
  });
});
