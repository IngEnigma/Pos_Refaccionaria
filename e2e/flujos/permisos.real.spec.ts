/**
 * FLU-PER — Permisos por ruta y rol contra backend REAL local (plan-pruebas-flujos-e2e.md §3.14).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Misma matriz que `e2e/admin.access.spec.ts` (mocks), pero con login real: confirma que el rol que deduce el back
 * coincide con lo que espera el front y que ninguna pantalla permitida recibe 403 en su carga inicial.
 * La fuente de verdad de los permisos es `repository/permissions.py` del back.
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { DB, loginAsReal } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

type Rol = 'admin' | 'manager' | 'cajero' | 'sinSucursal';

const USUARIOS: Record<Rol, TestUser> = {
  admin: TEST_USERS.adminE2e,
  manager: TEST_USERS.gerenteGeneral,
  cajero: TEST_USERS.anaCentro,
  sinSucursal: TEST_USERS.vendedorSinPerfil,
};
const ROLES = Object.keys(USUARIOS) as Rol[];

const TODOS: Rol[] = ROLES;
const ADMIN: Rol[] = ['admin'];
const ADMIN_MANAGER: Rol[] = ['admin', 'manager'];

/** Ruta privada, quién entra (tabla §2) y la etiqueta de su opción de menú. */
const RUTAS: { ruta: string; roles: Rol[]; menu: string }[] = [
  { ruta: '/sales', roles: TODOS, menu: 'Menú' },
  { ruta: '/inventory', roles: TODOS, menu: 'Inventario' },
  { ruta: '/history', roles: TODOS, menu: 'Historial' },
  { ruta: '/suppliers', roles: TODOS, menu: 'Proveedores' },
  { ruta: '/clients', roles: TODOS, menu: 'Clientes' },
  { ruta: '/notifications', roles: TODOS, menu: 'Notificaciones' },
  { ruta: '/reports', roles: ADMIN_MANAGER, menu: 'Reportes' }, // H-F4-3
  { ruta: '/inventory-by-branch', roles: ADMIN_MANAGER, menu: 'Inventario Sucursal' },
  { ruta: '/manager/cashiers', roles: ADMIN_MANAGER, menu: 'Cajeros' },
  { ruta: '/branches', roles: ADMIN, menu: 'Sucursales' },
  { ruta: '/branch-pricing', roles: ADMIN, menu: 'Precios por Sucursal' },
  { ruta: '/admin', roles: ADMIN, menu: 'Administración' },
];

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('Permisos flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  test.beforeEach(async ({ page }) => {
    expect(await wakeBackend(page)).toBe(true);
  });

  for (const { ruta, roles } of RUTAS) {
    for (const rol of ROLES) {
      const entra = roles.includes(rol);
      test(`FLU-PER-001 ${rol} ${entra ? 'entra a' : 'no entra a'} ${ruta}`, async ({ page }) => {
        const prohibidas: string[] = [];
        page.on('response', (r) => r.status() === 403 && r.url().includes('/api/') && prohibidas.push(r.url()));
        await loginAsReal(page, USUARIOS[rol]);

        await page.goto(ruta);
        if (entra) {
          await expect(page).toHaveURL(new RegExp(`${escapar(ruta)}$`));
          await page.waitForLoadState('networkidle');
          // el back no puede rechazar una pantalla que el front deja abrir
          expect(prohibidas, `403 del back al cargar ${ruta} como ${rol}`).toEqual([]);
          await expect(page).toHaveURL(new RegExp(`${escapar(ruta)}$`));
        } else {
          await expect(page).toHaveURL(/\/sales$/);
        }
      });
    }
  }

  for (const { ruta } of RUTAS) {
    test(`FLU-PER-002 sin sesión ${ruta} manda a /login con redirectTo`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login\?/);
      expect(new URL(page.url()).searchParams.get('redirectTo')).toBe(ruta);
    });
  }

  for (const rol of ROLES) {
    test(`FLU-PER-003 ${rol}: el menú lista exactamente las rutas que puede abrir`, async ({ page }) => {
      await loginAsReal(page, USUARIOS[rol]);
      await page.goto('/sales');
      const nav = page.getByRole('navigation').first();
      await expect(nav.getByRole('link', { name: 'Menú', exact: true })).toBeVisible();

      const esperado = RUTAS.filter((r) => r.roles.includes(rol)).map((r) => r.menu);
      const real = (await nav.getByRole('link').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
      expect(real.sort()).toEqual([...esperado].sort());
    });
  }
});
