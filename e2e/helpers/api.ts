/**
 * Helpers E2E de flujos contra backend real local: login por API y sesión inyectada por rol.
 */
import { execFileSync } from 'node:child_process';

import { Page, request } from '@playwright/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { API_PREFIX } from './backend';

export interface ApiLogin {
  access: string;
  refresh: string;
  user: { id: number; username: string; isadmin: boolean; isstaff: boolean; id_sucursal: number | null; rol: string };
}

/** Rol del front según `user.rol` del backend (ver auth-role.mapper.ts). */
const ROLE_BY_ROL: Record<string, string> = { cajero: 'seller', encargado: 'manager', admin: 'admin' };

/** POST /api/login (sin "/" final, así lo define el back) → tokens y usuario. Falla si las credenciales no son válidas. */
export async function apiLogin(user: Pick<TestUser, 'username' | 'password'>): Promise<ApiLogin> {
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${API_PREFIX}/login`, { data: { username: user.username, password: user.password } });
    if (!res.ok()) throw new Error(`login API ${user.username}: ${res.status()} ${await res.text()}`);
    return (await res.json()) as ApiLogin;
  } finally {
    await ctx.dispose();
  }
}

const jwtExp = (jwt: string): number => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()).exp ?? 0;

/** Deja la sesión recordada en localStorage como la guarda SessionStateService, antes de cargar la app. */
export async function loginAsReal(
  page: Page,
  user: TestUser = TEST_USERS.anaCentro,
  opts: { accessInvalido?: boolean } = {},
): Promise<ApiLogin> {
  const s = await apiLogin(user);
  const primitives = {
    // accessInvalido: firma alterada (exp vigente) → el back responde 401 y el front debe renovar con el refresh real.
    accessToken: opts.accessInvalido ? `${s.access.slice(0, -4)}AAAA` : s.access,
    refreshToken: s.refresh,
    accessExp: jwtExp(s.access),
    refreshExp: jwtExp(s.refresh),
    userId: String(s.user.id),
    role: ROLE_BY_ROL[s.user.rol] ?? 'seller',
    username: s.user.username,
  };
  await page.addInitScript((p) => {
    localStorage.setItem('session', JSON.stringify(p));
    localStorage.setItem('session:remember', 'true');
  }, primitives);
  return s;
}

// ───────────── BD E2E (sqlite3) y API autenticada para verificar lo guardado ─────────────

export const DB = process.env['E2E_DB'];

/** Consulta de solo lectura/escritura sobre db.e2e.sqlite3 (CLI `sqlite3`, espera hasta 10 s si el back tiene la BD bloqueada). Requiere E2E_DB. */
export const sql = (q: string): string => execFileSync('sqlite3', ['-cmd', '.timeout 10000', DB!, q], { encoding: 'utf8' }).trim();

export const stockDe = (clave: string, sucursalId: number): number =>
  Number(sql(`select cantidad from inventario_stock where id_sucursal_id=${sucursalId} and id_producto_id=(select id from producto_producto where clave='${clave}')`));

export const fijarStock = (clave: string, sucursalId: number, cantidad: number): void => {
  sql(`update inventario_stock set cantidad=${cantidad} where id_sucursal_id=${sucursalId} and id_producto_id=(select id from producto_producto where clave='${clave}')`);
};

export const productoId = (clave: string): number => Number(sql(`select id from producto_producto where clave='${clave}'`));

/** Petición autenticada a la API (ruta con "/" final donde el back lo exige, ej. `ventas/`). */
export async function apiFetch(user: Pick<TestUser, 'username' | 'password'>, method: 'GET' | 'POST' | 'PUT' | 'DELETE', ruta: string, data?: unknown) {
  const { access } = await apiLogin(user);
  const ctx = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${access}` } });
  try {
    const res = await ctx.fetch(`${API_PREFIX}/${ruta}`, { method, data });
    return { status: res.status(), body: await res.json().catch(() => null) };
  } finally {
    await ctx.dispose();
  }
}

export interface MetodoPago {
  id: number;
  tipo: string;
}

/** Métodos de pago del backend: la matriz de ventas se arma con ellos. */
export async function metodosPago(): Promise<MetodoPago[]> {
  return (await apiFetch(TEST_USERS.anaCentro, 'GET', 'metodopago/')).body as MetodoPago[];
}

/** Crea una venta por API (1 unidad de cada clave) como `user`; devuelve la venta creada. */
export async function crearVentaApi(user: TestUser, metodoId: number, items: { clave: string; cantidad: number }[]) {
  const r = await apiFetch(user, 'POST', 'ventas/', {
    id_metodo_pago: metodoId,
    detalles: items.map((i) => ({ id_producto: productoId(i.clave), cantidad: i.cantidad })),
  });
  if (r.status !== 201) throw new Error(`crear venta API: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body as { id: number; total: string; id_sucursal: number; id_metodo_pago: number };
}
