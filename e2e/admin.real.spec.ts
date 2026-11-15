/**
 * SMOKE contra backend REAL local: alta de usuario desde /admin con sucursal y rol (H-47).
 *
 *   npm run e2e:local
 *
 * Requiere el seed del backend: admin.e2e (rol admin con perfil) y 3 sucursales (se elige la id 2).
 * Cada corrida crea un usuario con nombre único.
 */
import { test, expect } from '@playwright/test';

import { TEST_USERS } from './fixtures/test-users';
import { API_BASE, wakeBackend } from './helpers/backend';

const REAL = process.env['E2E_REAL'] === '1';

test.describe('Admin REAL (backend local)', () => {
  test.skip(!REAL, 'Solo con E2E_REAL=1 (backend real)');
  test.slow();

  test('admin da de alta un cajero con sucursal y rol: queda con perfil', async ({ page, request }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const username = `e2e.${Date.now()}`;
    const password = 'Secreta123';

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(TEST_USERS.adminE2e.username);
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(TEST_USERS.adminE2e.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/sales/, { timeout: 30_000 });
    // La sesión vive en memoria: se navega por el menú, no con goto.
    await page.getByRole('link', { name: /Administración/ }).first().click();
    await expect(page).toHaveURL(/\/admin/);

    await page.getByLabel('Usuario', { exact: true }).fill(username);
    await page.getByLabel('Correo', { exact: true }).nth(1).fill(`${username}@trt.com`);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByLabel('Sucursal', { exact: true }).selectOption({ index: 2 }); // 2.ª sucursal (id 2); H-41: el backend no manda el nombre, las opciones salen vacías
    await page.getByLabel('Rol').selectOption({ label: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(page.locator('.toast-message').filter({ hasText: 'Usuario creado correctamente.' })).toBeVisible();

    // El usuario nuevo puede entrar y su perfil trae la sucursal y el rol elegidos.
    const login = await request.post(`${API_BASE}/api/login`, { data: { username, password } });
    expect(login.ok()).toBeTruthy();
    const sesion = await login.json();
    expect(sesion.user.rol).toBe('cajero');
    const perfil = await request.get(`${API_BASE}/api/perfil/`, { headers: { Authorization: `Bearer ${sesion.access}` } });
    expect(perfil.ok()).toBeTruthy();
    expect((await perfil.json()).id_sucursal).toBe(2);
  });
});
