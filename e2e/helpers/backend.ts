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

import {
  BRANCHES,
  INVENTARIO_MI_SUCURSAL,
  PAYMENT_METHODS,
  PRODUCT_TYPES,
  SUCURSAL_ID,
} from '../fixtures/api-data';

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

// ───────────────────────── Fase 6: E2E con mocks ─────────────────────────

export type E2eRole = 'admin' | 'manager' | 'seller';

/** El front deduce el rol de isAdmin/isStaff (auth-role.mapper.ts, H-46). */
const ROLE_FLAGS: Record<E2eRole, { isAdmin: boolean; isStaff: boolean }> = {
  admin: { isAdmin: true, isStaff: true },
  manager: { isAdmin: false, isStaff: true },
  seller: { isAdmin: false, isStaff: false },
};

export function sessionFor(role: E2eRole, username = `${role}1`) {
  return {
    accessToken: 'e2e.access',
    refreshToken: 'e2e.refresh',
    user: { id: 1, username, ...ROLE_FLAGS[role] },
  };
}

export interface MockCall {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const apiRegex = (ruta: string) =>
  new RegExp(`^https://${API_HOST.replace(/\./g, '\\.')}/api${ruta}/?(\\?.*)?$`);

/**
 * Mockea `ruta` (ej. '/sucursales', '/ventas/77/ticket') de la API. Tolera el "/" final
 * que agrega trailingSlashInterceptor. `body` puede ser una función (req) => cuerpo.
 * Sin `method` responde a cualquier método. Devuelve el arreglo de llamadas recibidas.
 * Las rutas registradas después ganan: llamar antes mockLoginAs (trae el catch-all).
 */
export async function mockApi(
  page: Page,
  ruta: string,
  body: unknown | ((call: MockCall) => unknown),
  status = 200,
  method?: string,
): Promise<MockCall[]> {
  const calls: MockCall[] = [];
  await page.route(apiRegex(ruta), async (route) => {
    const req = route.request();
    if (method && req.method() !== method) return route.fallback();
    const call: MockCall = {
      method: req.method(),
      url: req.url(),
      headers: req.headers(),
      body: req.postData() ? safeJson(req.postData()!) : null,
    };
    calls.push(call);
    const payload = typeof body === 'function' ? (body as (c: MockCall) => unknown)(call) : body;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
  return calls;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Backend mínimo "feliz" para que cualquier página privada cargue sin tocar Render:
 * catch-all (GET → [], otro método → 501), login por rol, perfil con sucursal, catálogos del POS.
 */
export async function mockLoginAs(page: Page, role: E2eRole, username?: string) {
  await page.route(new RegExp(`^https://${API_HOST.replace(/\./g, '\\.')}/`), async (route) => {
    const isGet = route.request().method() === 'GET';
    await route.fulfill({
      status: isGet ? 200 : 501,
      contentType: 'application/json',
      body: JSON.stringify(isGet ? [] : { detail: 'E2E: endpoint sin mock' }),
    });
  });
  await page.route(LOGIN_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionFor(role, username)),
    });
  });
  await mockApi(page, '/perfil', { id: 1, id_usuario: 1, id_sucursal: SUCURSAL_ID });
  await mockApi(page, '/metodopago', PAYMENT_METHODS);
  await mockApi(page, '/tipos', PRODUCT_TYPES);
  await mockApi(page, '/inventarios/mi-sucursal', INVENTARIO_MI_SUCURSAL);
  await mockApi(page, '/sucursales', BRANCHES, 200, 'GET');
}

/**
 * Deja la sesión en localStorage ANTES de cargar la app (con "recordar"), para entrar directo a
 * cualquier ruta sin pasar por la UI de login (la sesión vive en memoria y se pierde al recargar
 * salvo que esté recordada; la UI no ofrece "recordar", H-19). Se siembra una sola vez por pestaña.
 */
export async function seedSession(page: Page, role: E2eRole, username?: string) {
  const s = sessionFor(role, username);
  const primitives = {
    accessToken: s.accessToken,
    refreshToken: s.refreshToken,
    accessExp: 0,
    refreshExp: 0,
    userId: String(s.user.id),
    role,
    username: s.user.username,
  };
  await page.addInitScript((p) => {
    if (sessionStorage.getItem('__e2e_seeded')) return;
    sessionStorage.setItem('__e2e_seeded', '1');
    localStorage.setItem('session', JSON.stringify(p));
    localStorage.setItem('session:remember', 'true');
  }, primitives);
}

/** mockLoginAs + sesión sembrada: listo para `page.goto('/ruta')`. */
export async function loginAs(page: Page, role: E2eRole, username?: string) {
  await mockLoginAs(page, role, username);
  await seedSession(page, role, username);
}
