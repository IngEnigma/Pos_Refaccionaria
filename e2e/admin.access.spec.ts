/**
 * SISTEMA E2E — Acceso por rol (SIS-053, nuevo). Con mocks, sin Render.
 * Cubre H-01 (roleGuard con data.roles en app.routes.ts) y H-02 (el sidebar filtra por rol).
 * El rol sale de isAdmin/isStaff (H-46): admin = ambos, manager = solo isStaff, seller = ninguno.
 */
import { test, expect, Page } from '@playwright/test';

import { E2eRole, loginAs } from './helpers/backend';

const nav = (page: Page) => page.getByRole('navigation').first();
const link = (page: Page, name: string) => nav(page).getByRole('link', { name, exact: true });

/** Rutas restringidas con el enlace del sidebar que las representa. */
const ONLY_ADMIN = [
  { ruta: '/admin', menu: 'Administración' },
  { ruta: '/branches', menu: 'Sucursales' },
  { ruta: '/branch-pricing', menu: 'Precios por Sucursal' },
];
const ADMIN_OR_MANAGER = [
  { ruta: '/inventory-by-branch', menu: 'Inventario Sucursal' },
  { ruta: '/manager/cashiers', menu: 'Cajeros' },
];
const ALL_ROLES_MENU = ['Menú', 'Inventario', 'Reportes', 'Historial', 'Proveedores', 'Clientes', 'Notificaciones'];

async function enter(page: Page, role: E2eRole, ruta: string) {
  await loginAs(page, role);
  await page.goto(ruta);
}

test.describe('Acceso por rol — SIS-053', () => {
  test('seller: el sidebar no muestra opciones de admin ni de manager', async ({ page }) => {
    await enter(page, 'seller', '/sales');
    await expect(link(page, 'Menú')).toBeVisible();
    for (const menu of ALL_ROLES_MENU) await expect(link(page, menu)).toBeVisible();
    for (const { menu } of [...ONLY_ADMIN, ...ADMIN_OR_MANAGER]) await expect(link(page, menu)).toHaveCount(0);
  });

  for (const { ruta } of [...ONLY_ADMIN, ...ADMIN_OR_MANAGER]) {
    test(`seller: ${ruta} por URL directa lo devuelve a /sales`, async ({ page }) => {
      await enter(page, 'seller', ruta);
      await expect(page).toHaveURL(/\/sales$/);
    });
  }

  test('manager: ve solo lo suyo en el sidebar', async ({ page }) => {
    await enter(page, 'manager', '/sales');
    for (const menu of [...ALL_ROLES_MENU, ...ADMIN_OR_MANAGER.map((m) => m.menu)]) {
      await expect(link(page, menu)).toBeVisible();
    }
    for (const { menu } of ONLY_ADMIN) await expect(link(page, menu)).toHaveCount(0);
  });

  for (const { ruta } of ADMIN_OR_MANAGER) {
    test(`manager: entra a ${ruta}`, async ({ page }) => {
      await enter(page, 'manager', ruta);
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
    });
  }

  for (const { ruta } of ONLY_ADMIN) {
    test(`manager: ${ruta} por URL directa lo devuelve a /sales`, async ({ page }) => {
      await enter(page, 'manager', ruta);
      await expect(page).toHaveURL(/\/sales$/);
    });
  }

  test('admin: ve todas las opciones del sidebar', async ({ page }) => {
    await enter(page, 'admin', '/sales');
    const todas = [...ALL_ROLES_MENU, ...ONLY_ADMIN.map((m) => m.menu), ...ADMIN_OR_MANAGER.map((m) => m.menu)];
    for (const menu of todas) await expect(link(page, menu)).toBeVisible();
  });

  for (const { ruta } of [...ONLY_ADMIN, ...ADMIN_OR_MANAGER]) {
    test(`admin: entra a ${ruta}`, async ({ page }) => {
      await enter(page, 'admin', ruta);
      await expect(page).toHaveURL(new RegExp(`${ruta}$`));
    });
  }

  test('admin: navega desde el sidebar a Sucursales', async ({ page }) => {
    await enter(page, 'admin', '/sales');
    await link(page, 'Sucursales').click();
    await expect(page).toHaveURL(/\/branches$/);
    await expect(page.getByRole('heading', { name: 'Sucursales', level: 1 })).toBeVisible();
  });

  test('sin sesión, las rutas de admin mandan a /login', async ({ page }) => {
    for (const { ruta } of ONLY_ADMIN) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
