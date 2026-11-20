/**
 * FLU-GER — Gerente contra backend REAL local (plan-pruebas-flujos-e2e.md §3.11).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * La pantalla /manager (cashiers-management.page) es hoy una maqueta: lista 3 cajeros fijos y su formulario no
 * envía nada (sin facade ni repositorio). Por eso GER-001/002 se prueban contra la API de usuarios que el gerente
 * ya tiene (`/api/users`) y las versiones por UI quedan en `test.fixme` (H-F4-1). GER-003 y GER-004 sí usan la UI real.
 * `gerente.general` es encargado NO staff (seed): rige su permiso por rol y su alcance por sucursal.
 * Cada prueba crea usuarios `e2e.ger.<timestamp>` y limpia de la BD usuario, perfil y ventas.
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, DB, fijarStock, loginAsReal, metodosPago, sql, stockDe } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const PREFIJO = 'e2e.ger.';
const PASSWORD = 'Secreta123';
const CENTRO = 1;
const NORTE = 2;
const A = { clave: 'E2E-002', nombre: 'Filtro E2E' };
const GERENTE = TEST_USERS.gerenteGeneral;

const unico = () => `${PREFIJO}${Date.now()}`;
const enlace = (page: Page, name: string) => page.getByRole('navigation').first().getByRole('link', { name, exact: true });
const perfilEnBd = (username: string) =>
  sql(`select p.rol||'|'||p.id_sucursal_id||'|'||u.is_active from usuario_perfil p join auth_user u on u.id=p.usuario_id where u.username='${username}'`);
const idEnBd = (username: string) => Number(sql(`select id from auth_user where username='${username}'`));

interface UsuarioApi {
  id: number;
  username: string;
  rol: string;
  id_sucursal: number | null;
  is_active: boolean;
}

/** Alta por API como gerente (el back fuerza rol cajero y su sucursal). */
async function altaComoGerente(username: string, extra: Record<string, unknown> = {}) {
  return apiFetch(GERENTE, 'POST', 'users', { username, password: PASSWORD, email: `${username}@trt.com`, is_active: true, ...extra });
}

async function loginUI(page: Page, username: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(username);
  await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test.describe('Gerente flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  let stockCentro: number;
  test.beforeEach(() => {
    stockCentro = stockDe(A.clave, CENTRO);
  });
  test.afterEach(() => {
    const ids = `select id from auth_user where username like '${PREFIJO}%'`;
    sql(`delete from ventas_detalleventa where id_venta_id in (select id from ventas_venta where id_usuario_id in (${ids}))`);
    sql(`delete from ventas_venta where id_usuario_id in (${ids})`);
    sql(`delete from usuario_perfil where usuario_id in (${ids})`);
    sql(`delete from auth_user where username like '${PREFIJO}%'`);
    fijarStock(A.clave, CENTRO, stockCentro);
  });

  test('FLU-GER-001 el gerente ve en su pantalla a los cajeros de su sucursal y no los de otras (API)', async () => {
    const r = await apiFetch(GERENTE, 'GET', 'users');
    expect(r.status).toBe(200);
    const usuarios = r.body as UsuarioApi[];
    const nombres = usuarios.map((u) => u.username);

    expect(nombres).toEqual(expect.arrayContaining(['ana.centro', 'carlos.centro', 'gerente.general']));
    expect(nombres).not.toEqual(expect.arrayContaining(['maria.norte']));
    expect(nombres).not.toEqual(expect.arrayContaining(['luis.sur']));
    expect(usuarios.every((u) => u.id_sucursal === CENTRO)).toBe(true);

    // Un cajero no puede listar usuarios
    expect((await apiFetch(TEST_USERS.anaCentro, 'GET', 'users')).status).toBe(403);
  });

  test.fixme('FLU-GER-001b /manager lista los cajeros reales de Centro y no los de Norte (UI) — H-F4-1', async ({ page }) => {
    // H-F4-1: la pantalla muestra 3 cajeros fijos (Ana Lira, Roberto Solis, Iris Molina), no llama a la API.
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, GERENTE);
    await page.goto('/manager/cashiers');
    await expect(page.getByRole('row').filter({ hasText: 'ana.centro' })).toHaveCount(1);
    await expect(page.getByRole('row').filter({ hasText: 'maria.norte' })).toHaveCount(0);
  });

  test('FLU-GER-002 el gerente da de alta, edita y da de baja un cajero de su sucursal (API)', async () => {
    const username = unico();

    // Alta: aunque pida Norte y rol admin, queda cajero de Centro
    const alta = await altaComoGerente(username, { id_sucursal: NORTE, rol: 'admin' });
    expect(alta.status).toBe(201);
    const { id } = alta.body as UsuarioApi;
    expect(perfilEnBd(username)).toBe(`cajero|${CENTRO}|1`);

    // Edición: correo
    const edit = await apiFetch(GERENTE, 'PUT', `users/${id}`, { email: `${username}.nuevo@trt.com` });
    expect(edit.status).toBe(200);
    expect(sql(`select email from auth_user where id=${id}`)).toBe(`${username}.nuevo@trt.com`);

    // Baja = desactivar (borrar es solo de admin)
    const baja = await apiFetch(GERENTE, 'PUT', `users/${id}`, { is_active: false });
    expect(baja.status).toBe(200);
    expect(perfilEnBd(username)).toBe(`cajero|${CENTRO}|0`);
    expect((await apiFetch(GERENTE, 'DELETE', `users/${id}`)).status).toBe(403);

    // No toca usuarios de otra sucursal
    const norte = idEnBd('maria.norte');
    expect((await apiFetch(GERENTE, 'PUT', `users/${norte}`, { is_active: false })).status).toBe(403);
    expect(sql(`select is_active from auth_user where id=${norte}`)).toBe('1');
  });

  test.fixme('FLU-GER-002b el formulario de /manager crea, edita y da de baja un cajero (UI) — H-F4-1', async ({ page }) => {
    // H-F4-1: "Crear cajero" no tiene (click) ni formulario reactivo: no hay llamada a POST /api/users.
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const username = unico();
    await loginAsReal(page, GERENTE);
    await page.goto('/manager/cashiers');
    await page.getByLabel('Nombre completo').fill(username);
    await page.getByLabel('Correo').fill(`${username}@trt.com`);
    await page.getByRole('button', { name: 'Crear cajero' }).click();
    await expect(page.getByRole('row').filter({ hasText: username })).toHaveCount(1);
    expect(perfilEnBd(username)).toBe(`cajero|${CENTRO}|1`);
  });

  test('FLU-GER-003 el cajero creado por el gerente entra por UI y vende en la sucursal del gerente', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const username = unico();
    const [efectivo] = await metodosPago();
    const alta = await altaComoGerente(username);
    expect(alta.status).toBe(201);

    await loginUI(page, username);
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(page.getByText('SUC-1')).toBeVisible();
    // Sin opciones de gerente ni admin
    await expect(enlace(page, 'Cajeros')).toHaveCount(0);

    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: A.nombre }) });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole('button', { name: 'Añadir' }).click();
    const panel = page.getByRole('complementary', { name: 'Detalle de venta' });
    await panel.getByRole('button', { name: efectivo.tipo, exact: true }).click();
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel.getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201);
    const venta = (await res.json()) as { id: number };

    // BD: venta a nombre del cajero nuevo, en Centro, y stock -1 solo ahí
    expect(sql(`select id_usuario_id||'|'||id_sucursal_id||'|'||id_metodo_pago_id from ventas_venta where id=${venta.id}`)).toBe(
      `${idEnBd(username)}|${CENTRO}|${efectivo.id}`,
    );
    expect(stockDe(A.clave, CENTRO)).toBe(stockCentro - 1);
  });

  test('FLU-GER-004 el cajero no entra a /manager; el gerente sí lo ve en el menú y entra', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');

    await loginAsReal(page, TEST_USERS.anaCentro);
    await page.goto('/manager/cashiers');
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(enlace(page, 'Cajeros')).toHaveCount(0);

    await loginAsReal(page, GERENTE);
    await page.goto('/sales');
    await expect(enlace(page, 'Cajeros')).toBeVisible();
    await enlace(page, 'Cajeros').click();
    await expect(page).toHaveURL(/\/manager\/cashiers$/);
    await expect(page.getByRole('heading', { name: 'Cajeros de mi sucursal', level: 1 })).toBeVisible();
  });
});
