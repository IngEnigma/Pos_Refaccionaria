/**
 * FLU-AUT — Auth contra backend REAL local (plan-pruebas-flujos-e2e.md §3.1).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 */
import { test, expect, type Page } from '../helpers/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { loginAsReal } from '../helpers/api';
import { API_PREFIX, wakeBackend } from '../helpers/backend';

test.describe('Auth flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1', 'Solo con E2E_REAL=1 (backend real)');

  const OPCIONES_COMUNES = ['Menú', 'Inventario', 'Historial', 'Proveedores', 'Clientes', 'Notificaciones'];
  // Reportes: el back exige `reporte.ver` (encargado y admin); el cajero recibe 403 (H-F4-3)
  const SOLO_MANAGER_ADMIN = ['Inventario Sucursal', 'Cajeros', 'Reportes'];
  const SOLO_ADMIN = ['Administración', 'Sucursales', 'Precios por Sucursal'];

  const casos: { rol: string; user: TestUser; ve: string[]; noVe: string[] }[] = [
    { rol: 'admin', user: TEST_USERS.adminE2e, ve: [...OPCIONES_COMUNES, ...SOLO_MANAGER_ADMIN, ...SOLO_ADMIN], noVe: [] },
    { rol: 'manager', user: TEST_USERS.gerenteGeneral, ve: [...OPCIONES_COMUNES, ...SOLO_MANAGER_ADMIN], noVe: SOLO_ADMIN },
    { rol: 'cajero', user: TEST_USERS.anaCentro, ve: OPCIONES_COMUNES, noVe: [...SOLO_MANAGER_ADMIN, ...SOLO_ADMIN] },
  ];

  for (const { rol, user, ve, noVe } of casos) {
    test(`FLU-AUT-001 login ${rol} llega a /sales y el sidebar muestra solo sus opciones`, async ({ page }) => {
      test.skip(!(await wakeBackend(page)), 'Backend no disponible');

      await page.goto('/login');
      await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(user.username);
      await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(user.password);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });

      const link = (name: string) => page.getByRole('navigation').first().getByRole('link', { name, exact: true });
      for (const name of ve) await expect(link(name)).toBeVisible();
      for (const name of noVe) await expect(link(name)).toHaveCount(0);
    });
  }

  async function loginUI(page: Page, user: TestUser, recordar = false) {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(user.username);
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(user.password);
    if (recordar) await page.getByLabel('Recordar sesión').check();
    await page.getByRole('button', { name: 'Ingresar' }).click();
  }

  test('FLU-AUT-002 credenciales inválidas: se queda en /login con el mensaje del backend', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const res = await page.request.post(`${API_PREFIX}/login`, { data: { username: 'ana.centro', password: 'mala' } });
    expect(res.status()).toBe(401);
    const mensaje: string = (await res.json()).error;

    await loginUI(page, { ...TEST_USERS.anaCentro, password: 'mala' });

    await expect(page.locator('.toast-message').first()).toContainText(mensaje);
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('session'))).toBeNull();
  });

  test('FLU-AUT-003 campos vacíos no llaman al backend', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const logins: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/api\/login/.test(r.url()) && logins.push(r.url()));
    await page.goto('/login');

    const ingresar = page.getByRole('button', { name: 'Ingresar' });
    await expect(ingresar).toBeDisabled();
    await ingresar.click({ force: true });
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill('ana.centro');
    await expect(ingresar).toBeDisabled(); // falta la contraseña
    await ingresar.click({ force: true });

    expect(logins).toHaveLength(0);
    await expect(page).toHaveURL(/\/login/);
  });

  test('FLU-AUT-004 "Recordar sesión": recargar conserva la sesión; sin recordar, se pierde', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');

    await loginUI(page, TEST_USERS.anaCentro, true);
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await page.reload();
    await expect(page).toHaveURL(/\/sales$/);
    await expect(page.getByRole('complementary', { name: 'Detalle de venta' })).toBeVisible();

    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await loginUI(page, TEST_USERS.anaCentro, false);
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test('FLU-AUT-005 access vencido: el refresh real renueva y la petición se reintenta', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, TEST_USERS.anaCentro, { accessInvalido: true });
    const refrescos: number[] = [];
    const api: { url: string; status: number }[] = [];
    page.on('response', (r) => {
      if (r.request().method() === 'POST' && /\/api\/token\/refresh/.test(r.url())) refrescos.push(r.status());
      if (/\/api\//.test(r.url()) && !/token\/refresh/.test(r.url()) && r.request().method() !== 'OPTIONS') api.push({ url: r.url(), status: r.status() });
    });

    await page.goto('/sales');

    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 30_000 }); // el catálogo cargó tras el reintento
    expect(refrescos).toContain(200);
    // La petición original fue rechazada (401) y se reintentó con el token nuevo (200) en la misma URL.
    const rechazada = api.find((r) => r.status === 401);
    expect(rechazada).toBeDefined();
    expect(api.some((r) => r.url === rechazada!.url && r.status === 200)).toBe(true);
    await expect(page).toHaveURL(/\/sales$/);
  });

  test('FLU-AUT-006 logout limpia el almacenamiento y bloquea las rutas privadas', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginUI(page, TEST_USERS.anaCentro, true);
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });

    await page.getByRole('button', { name: 'Perfil' }).click();
    await page.getByText('Cerrar sesión').click();

    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('session'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('session'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('session:remember'))).toBeNull();
    for (const ruta of ['/sales', '/history', '/inventory']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('FLU-AUT-007 usuario sin sucursal ve el estado vacío del POS', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginUI(page, TEST_USERS.vendedorSinPerfil);

    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(page.getByText('Tu usuario no tiene sucursal asignada.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Procesar transacción' })).toBeDisabled();
  });
});
