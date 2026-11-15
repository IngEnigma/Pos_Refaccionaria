/**
 * SISTEMA E2E — Usuarios y sucursales desde /admin (SIS-050). Con mocks, sin Render.
 * La página usa users.facade / branches.facade (H-03). El caso original "quitarle permiso de
 * reportes" no existe en la UI. El alta envía sucursal y rol (H-47); aquí se cubre el
 * alta/listado de usuarios y la alta de sucursal.
 */
import { test, expect, Page } from '@playwright/test';

import { BRANCHES, USERS } from './fixtures/api-data';
import { loginAs, mockApi } from './helpers/backend';

const toast = (page: Page, texto: string | RegExp) =>
  page.locator('.toast-message').filter({ hasText: texto });
const usersTable = (page: Page) => page.getByRole('table', { name: /Usuarios con su correo/ });

async function setup(page: Page) {
  await loginAs(page, 'admin');
  const users = USERS.map((u) => ({ ...u }));
  const sucursales = BRANCHES.map((b) => ({ ...b }));
  await mockApi(page, '/users', () => users, 200, 'GET');
  const userPosts = await mockApi(
    page,
    '/users',
    (call) => {
      const b = call.body as { username: string; email: string; is_active: boolean };
      const nuevo = { id: 3, username: b.username, email: b.email, is_active: b.is_active };
      users.push(nuevo);
      return nuevo;
    },
    201,
    'POST',
  );
  await mockApi(page, '/sucursales', () => sucursales, 200, 'GET');
  const branchPosts = await mockApi(
    page,
    '/sucursales',
    (call) => {
      const nueva = { id: 3, codigo_sucursal: 'SUC-003', ...(call.body as object) } as (typeof BRANCHES)[number];
      sucursales.push(nueva);
      return nueva;
    },
    201,
    'POST',
  );
  return { userPosts, branchPosts };
}

test.describe('Administración — SIS-050', () => {
  test('muestra el resumen y las tablas de sucursales y usuarios', async ({ page }) => {
    await setup(page);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Sucursales y usuarios', level: 1 })).toBeVisible();
    const resumen = page.getByRole('region', { name: 'Resumen administrativo' });
    await expect(resumen.getByText('Sucursales').locator('..')).toContainText('2');
    await expect(resumen.getByText('Usuarios', { exact: true }).locator('..')).toContainText('2');
    await expect(resumen.getByText('Usuarios activos').locator('..')).toContainText('1');

    await expect(usersTable(page).getByRole('row', { name: /ana\.centro/ })).toContainText('Inactivo');
    await expect(usersTable(page).getByRole('row', { name: /admin@trt\.com/ })).toContainText('Activo');
    await expect(page.getByRole('table', { name: /Sucursales registradas/ })).toContainText('SUC-002 · Calle Norte 45');
  });

  test('crea un usuario: envía el payload del backend, avisa y lo lista', async ({ page }) => {
    const { userPosts } = await setup(page);
    await page.goto('/admin');

    await page.getByLabel('Usuario', { exact: true }).fill('vendedor.nuevo');
    await page.getByLabel('Correo', { exact: true }).nth(1).fill('nuevo@trt.com');
    await page.getByLabel('Contraseña').fill('Secreta123');
    await page.getByLabel('Sucursal', { exact: true }).selectOption({ label: 'Norte' });
    await page.getByLabel('Rol').selectOption({ label: 'Cajero' });
    await page.getByLabel('Estado').selectOption({ label: 'Activo' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(toast(page, 'Usuario creado correctamente.')).toBeVisible();
    expect(userPosts).toHaveLength(1);
    expect(userPosts[0].body).toEqual({
      username: 'vendedor.nuevo',
      password: 'Secreta123',
      email: 'nuevo@trt.com',
      is_active: true,
      id_sucursal: 2,
      rol: 'cajero',
    });
    await expect(usersTable(page).getByRole('row', { name: /vendedor\.nuevo/ })).toContainText('nuevo@trt.com');
    await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue('');
  });

  test('un formulario de usuario incompleto no envía nada', async ({ page }) => {
    const { userPosts } = await setup(page);
    await page.goto('/admin');

    await page.getByLabel('Usuario', { exact: true }).fill('sin.password');
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(page.getByLabel('Contraseña')).toHaveClass(/ng-invalid/);
    await expect(page.locator('#user-branch-error')).toBeVisible();
    await expect(page.locator('#user-role-error')).toBeVisible();
    expect(userPosts).toHaveLength(0);
  });

  test('un usuario duplicado muestra el mensaje del backend (H-48)', async ({ page }) => {
    await setup(page);
    await mockApi(page, '/users', { error: 'El nombre de usuario ya existe' }, 400, 'POST');
    await page.goto('/admin');

    await page.getByLabel('Usuario', { exact: true }).fill('admin');
    await page.getByLabel('Correo', { exact: true }).nth(1).fill('otro@trt.com');
    await page.getByLabel('Contraseña').fill('Secreta123');
    await page.getByLabel('Sucursal', { exact: true }).selectOption({ label: 'Norte' });
    await page.getByLabel('Rol').selectOption({ label: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(toast(page, 'El nombre de usuario ya existe')).toBeVisible();
  });

  test('crea una sucursal desde la página de administración', async ({ page }) => {
    const { branchPosts } = await setup(page);
    await page.goto('/admin');

    await page.getByLabel('Nombre de sucursal').fill('Sur');
    await page.getByLabel('Teléfono').fill('5500001111');
    await page.getByLabel('Dirección').fill('Calle Sur 9');
    await page.getByLabel('Código postal').fill('08000');
    await page.getByLabel('Correo', { exact: true }).first().fill('sur@trt.com');
    await page.getByRole('button', { name: 'Guardar sucursal' }).click();

    await expect(toast(page, 'Sucursal creada correctamente.')).toBeVisible();
    expect(branchPosts[0].body).toMatchObject({ nombre_sucursal: 'Sur', numero_telefono: '5500001111' });
    await expect(page.getByRole('table', { name: /Sucursales registradas/ })).toContainText('Calle Sur 9');
  });
});
