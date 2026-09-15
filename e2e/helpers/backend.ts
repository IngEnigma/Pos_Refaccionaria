/**
 * Helpers E2E — backend Render (plan gratuito, cold-start).
 *
 * Base actual: https://refaccionariaback.onrender.com
 * API:         https://refaccionariaback.onrender.com/api  (ver src/env/environment.ts)
 * El interceptor trailingSlashInterceptor agrega "/" final → .../api/login/
 *
 * En plan gratuito Render "duerme" el servidor sin actividad (~50s para despertar).
 * Por eso:
 *  1. Los casos P0 usan MOCKS (no dependen de Render).
 *  2. Los casos con backend real deben llamar wakeBackend() primero y usar timeouts largos.
 */
import { Page, expect } from '@playwright/test';

export const API_HOST = 'refaccionariaback.onrender.com';
export const API_BASE = `https://${API_HOST}`;
export const API_PREFIX = `${API_BASE}/api`;

/** Matchea POST .../api/login/ con o sin trailing slash, sin tocar /login local. */
export const LOGIN_API = new RegExp(
  `${API_HOST.replace(/\./g, '\\.') }.*\\/login\\/?(\\?.*)?$`,
);

export const MOCK_SESSION = {
  accessToken: 'e2e.access',
  refreshToken: 'e2e.refresh',
  user: { id: 1, username: 'vendedor1', isAdmin: false, isStaff: true },
};

/** Mock de login válido. Usar en SIS-001 y derivados. */
export async function mockLoginOk(page: Page) {
  await page.route(LOGIN_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION),
    });
  });
}

/** Mock de login inválido (401). Usar en SIS-002. */
export async function mockLogin401(page: Page) {
  await page.route(LOGIN_API, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Credenciales inválidas' }),
    });
  });
}

/**
 * Despierta a Render antes de suites que SÍ pegan al backend real.
 * Reintenta hasta 3 veces con 60s por intento (cold-start típico 30-60s).
 * Devuelve false si no despertó: el llamador decide con
 * `test.skip(!desperto, 'Render no despertó (cold-start)')`.
 */
export async function wakeBackend(page: Page): Promise<boolean> {
  for (let i = 1; i <= 3; i++) {
    try {
      // Root responde 200 "API is running...". Cualquier <500 = despertó.
      const res = await page.request.get(API_BASE, { timeout: 60_000 });
      if (res.status() < 500) return true;
    } catch {
      /* Render aún dormido, reintenta */
    }
    await page.waitForTimeout(5_000);
  }
  return false;
}

/** Login por UI con mocks (rápido, sin Render). Devuelve cuando llega a /sales. */
export async function loginMockeado(
  page: Page,
  user = 'vendedor1',
  pass = 'secreta',
) {
  await mockLoginOk(page);
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(user);
  await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(pass);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/sales/, { timeout: 20_000 });
}
