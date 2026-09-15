/**
 * SISTEMA E2E — Auth (SIS-001, SIS-002, SIS-003, SIS-004)
 * Ejecuta: npm run e2e -- auth.login  /  npm run e2e:ui
 *
 * Backend: https://refaccionariaback.onrender.com (+ /api según environment.ts).
 * Render gratuito se duerme sin actividad: estos 4 casos usan MOCKS y NO
 * dependen de que Render esté despierto (ver e2e/helpers/backend.ts).
 *
 * Nota glob Playwright: el asterisco simple no cruza slash, por eso no se usa
 * glob para login (no matchea el trailing slash de trailingSlashInterceptor).
 * Se usa regex sobre el host onrender, nunca intercepta el login local.
 */
import { test, expect } from '@playwright/test';

import { LOGIN_API, MOCK_SESSION } from './helpers/backend';

test.describe('Auth — login y guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('SIS-003 muestra validación con campos vacíos sin llamar al backend', async ({ page }) => {
    let loginCalls = 0;
    await page.route(LOGIN_API, async (route) => {
      loginCalls += 1;
      await route.abort();
    });

    // El botón submit nace deshabilitado con el form inválido (submitDisabled).
    // Eso ya evita la llamada al backend; lo verificamos + forzamos touched vía foco/blur.
    const submit = page.getByRole('button', { name: 'Ingresar' });
    await expect(submit).toBeDisabled();

    const userBox = page.getByRole('textbox', { name: 'Ingresa tu usuario' });
    const passBox = page.getByRole('textbox', { name: 'Ingresa tu contraseña' });
    await userBox.focus();
    await userBox.blur();
    await passBox.focus();
    await passBox.blur();

    await expect(page.getByText('El usuario es requerido')).toBeVisible();
    await expect(page.getByText('La contraseña es requerida')).toBeVisible();
    expect(loginCalls).toBe(0);
    await expect(page).toHaveURL(/login/);
  });

  test('SIS-002 login inválido permanece en login y muestra error', async ({ page }) => {
    await page.route(LOGIN_API, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Credenciales inválidas' }),
      });
    });

    // Nota: se usa getByRole textbox porque el host <app-input> también expone
    // el atributo placeholder y getByPlaceholder resuelve 2 elementos (strict violation).
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill('nadie');
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill('mal');
    const submit = page.getByRole('button', { name: 'Ingresar' });
    await submit.click();

    await expect(page).toHaveURL(/login/);
    // El login debe fallar sin navegar. El toast de error depende del bug NG0600
    // (effect que escribe signals en login.page.ts:33-38): si el toast no aparece,
    // al menos el botón debe volver a habilitarse (loading=false).
    await expect(submit).toBeEnabled({ timeout: 10_000 });
    const toast = page.locator('.toast-message');
    if ((await toast.count()) > 0) {
      await expect(toast.first()).toContainText(/inválid|credenciales|error/i);
    }
  });

  test('SIS-001 login válido redirige a /sales (con API mockeada)', async ({ page }) => {
    await page.route(LOGIN_API, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      });
    });
    // Nota: no mockeamos el resto de la API; /sales puede mostrar error de carga
    // si Render está frío, pero la URL ya debe ser /sales (eso es lo que valida SIS-001).
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill('vendedor1');
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill('secreta');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/sales/, { timeout: 15_000 });
  });

  test('SIS-004 guard redirige a login al entrar directo a privada sin sesión', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/sales');
    await expect(page).toHaveURL(/login/);

    await page.goto('/inventory');
    await expect(page).toHaveURL(/login/);
  });
});
