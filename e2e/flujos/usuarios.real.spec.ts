/**
 * FLU-USR — Usuarios / Admin contra backend REAL local (plan-pruebas-flujos-e2e.md §3.10).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * La UI de /admin solo crea, activa/desactiva y elimina usuarios: NO edita rol ni sucursal (FLU-USR-002 aplica el cambio
 * por la API de admin, como lo haría otro cliente, y verifica lo que ve el usuario al volver a entrar).
 * Cada prueba crea usuarios `e2e.usr.<timestamp>` y limpia de la BD usuario, perfil y las ventas que haya hecho.
 */
import { expect, Page, test } from '../helpers/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, DB, fijarStock, loginAsReal, metodosPago, sql, stockDe } from '../helpers/api';
import { API_PREFIX, wakeBackend } from '../helpers/backend';

const PREFIJO = 'e2e.usr.';
const PASSWORD = 'Secreta123';
const NORTE = 2;
const SUR = 3;
const A = { clave: 'E2E-002', nombre: 'Filtro E2E', precio: 80 };

const unico = () => `${PREFIJO}${Date.now()}`;
const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });
const tablaUsuarios = (page: Page) => page.getByRole('table', { name: /Usuarios con su correo/ });
const filaUsuario = (page: Page, username: string) => tablaUsuarios(page).getByRole('row').filter({ hasText: username });
const dialogo = (page: Page) => page.getByRole('dialog');
const enlace = (page: Page, name: string) => page.getByRole('navigation').first().getByRole('link', { name, exact: true });
const perfilEnBd = (username: string) =>
  sql(`select p.rol||'|'||p.id_sucursal_id from usuario_perfil p join auth_user u on u.id=p.usuario_id where u.username='${username}'`);
const idEnBd = (username: string) => Number(sql(`select id from auth_user where username='${username}'`));

async function abrirAdmin(page: Page) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, TEST_USERS.adminE2e);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Sucursales y usuarios', level: 1 })).toBeVisible();
}

async function llenarUsuario(page: Page, v: { username: string; email: string; password?: string; sucursal?: string; rol?: string }) {
  await page.getByLabel('Usuario', { exact: true }).fill(v.username);
  await page.getByLabel('Correo', { exact: true }).nth(1).fill(v.email);
  await page.getByLabel('Contraseña').fill(v.password ?? PASSWORD);
  if (v.sucursal) await page.getByLabel('Sucursal', { exact: true }).selectOption({ label: v.sucursal });
  if (v.rol) await page.getByLabel('Rol').selectOption({ label: v.rol });
}

/** Alta por API como admin. */
async function crearUsuarioApi(username: string, rol: 'cajero' | 'encargado' | 'admin', sucursal: number) {
  const r = await apiFetch(TEST_USERS.adminE2e, 'POST', 'users', { username, password: PASSWORD, email: `${username}@trt.com`, is_active: true, id_sucursal: sucursal, rol });
  expect(r.status).toBe(201);
  return r.body as { id: number };
}

async function loginUI(page: Page, username: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(username);
  await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test.describe('Usuarios flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  let stockNorte: number;
  test.beforeEach(() => {
    stockNorte = stockDe(A.clave, NORTE);
  });
  test.afterEach(() => {
    const ids = `select id from auth_user where username like '${PREFIJO}%'`;
    sql(`delete from ventas_detalleventa where id_venta_id in (select id from ventas_venta where id_usuario_id in (${ids}))`);
    sql(`delete from ventas_venta where id_usuario_id in (${ids})`);
    sql(`delete from usuario_perfil where usuario_id in (${ids})`);
    sql(`delete from auth_user where username like '${PREFIJO}%'`);
    fijarStock(A.clave, NORTE, stockNorte);
  });

  test('FLU-USR-001 admin crea un cajero con rol y sucursal; ese usuario hace login por UI y vende', async ({ page, browser }) => {
    const username = unico();
    const [efectivo] = await metodosPago();
    await abrirAdmin(page);

    await llenarUsuario(page, { username, email: `${username}@trt.com`, sucursal: 'Norte', rol: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(toast(page, 'Usuario creado correctamente.')).toBeVisible();
    const fila = filaUsuario(page, username);
    await expect(fila).toContainText(`${username}@trt.com`);
    await expect(fila).toContainText('cajero');
    await expect(fila).toContainText('Norte');
    await expect(fila).toContainText('Activo');
    expect(perfilEnBd(username)).toBe(`cajero|${NORTE}`);

    // El usuario nuevo entra por la UI y vende en el POS de su sucursal
    const ctx = await browser.newContext();
    const pos = await ctx.newPage();
    await loginUI(pos, username);
    await expect(pos).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(pos.getByText('SUC-2')).toBeVisible();
    const card = pos.getByRole('article').filter({ has: pos.getByRole('heading', { name: A.nombre }) });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByRole('button', { name: 'Añadir' }).click();
    const panel = pos.getByRole('complementary', { name: 'Detalle de venta' });
    await panel.getByRole('button', { name: efectivo.tipo, exact: true }).click();
    const posted = pos.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel.getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201);
    const venta = (await res.json()) as { id: number };
    await ctx.close();

    // BD: venta a nombre del usuario nuevo, en su sucursal, y stock -1 solo ahí
    expect(sql(`select id_usuario_id||'|'||id_sucursal_id||'|'||id_metodo_pago_id from ventas_venta where id=${venta.id}`)).toBe(
      `${idEnBd(username)}|${NORTE}|${efectivo.id}`,
    );
    expect(stockDe(A.clave, NORTE)).toBe(stockNorte - 1);
  });

  test('FLU-USR-002 cambiar rol y sucursal cambia lo que ve al entrar; activar/desactivar desde /admin', async ({ page, browser }) => {
    const username = unico();
    const { id } = await crearUsuarioApi(username, 'cajero', NORTE);

    // Como cajero de Norte: sin opciones de gerente ni admin
    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    await loginUI(p1, username);
    await expect(p1).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(p1.getByText('SUC-2')).toBeVisible();
    await expect(enlace(p1, 'Clientes')).toBeVisible();
    await expect(enlace(p1, 'Cajeros')).toHaveCount(0);
    await expect(enlace(p1, 'Inventario Sucursal')).toHaveCount(0);
    await ctx1.close();

    // Admin le cambia rol y sucursal (la UI de /admin no lo permite: se hace por API)
    const cambio = await apiFetch(TEST_USERS.adminE2e, 'PUT', `users/${id}`, { rol: 'encargado', id_sucursal: SUR });
    expect(cambio.status).toBe(200);
    expect(perfilEnBd(username)).toBe(`encargado|${SUR}`);

    // Al volver a entrar: encargado de Sur, con sus opciones y sin las de admin
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await loginUI(p2, username);
    await expect(p2).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(p2.getByText('SUC-3')).toBeVisible();
    await expect(enlace(p2, 'Cajeros')).toBeVisible();
    await expect(enlace(p2, 'Inventario Sucursal')).toBeVisible();
    await expect(enlace(p2, 'Administración')).toHaveCount(0);
    await ctx2.close();

    // /admin refleja rol y sucursal nuevos y permite desactivar / activar
    await abrirAdmin(page);
    const fila = filaUsuario(page, username);
    await expect(fila).toContainText('encargado');
    await expect(fila).toContainText('Sur');
    await fila.getByRole('button', { name: `Desactivar usuario ${username}` }).click();
    await expect(toast(page, 'Usuario desactivado.')).toBeVisible();
    await expect(fila).toContainText('Inactivo');
    expect(sql(`select is_active from auth_user where username='${username}'`)).toBe('0');
    await fila.getByRole('button', { name: `Activar usuario ${username}` }).click();
    await expect(toast(page, 'Usuario activado.')).toBeVisible();
    await expect(fila).toContainText('Activo');
    expect(sql(`select is_active from auth_user where username='${username}'`)).toBe('1');
  });

  test('FLU-USR-003 eliminar un usuario (cancelar no borra): ya no puede hacer login', async ({ page, browser }) => {
    const username = unico();
    await crearUsuarioApi(username, 'cajero', NORTE);
    await abrirAdmin(page);

    // Cancelar: sigue existiendo
    await filaUsuario(page, username).getByRole('button', { name: `Eliminar usuario ${username}` }).click();
    await expect(dialogo(page)).toContainText(username);
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(filaUsuario(page, username)).toHaveCount(1);
    expect(idEnBd(username)).toBeGreaterThan(0);

    // Confirmar: desaparece de la tabla y de la BD (con su perfil)
    await filaUsuario(page, username).getByRole('button', { name: `Eliminar usuario ${username}` }).click();
    await dialogo(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect(toast(page, 'Usuario eliminado.')).toBeVisible();
    await expect(filaUsuario(page, username)).toHaveCount(0);
    expect(sql(`select count(*) from auth_user where username='${username}'`)).toBe('0');
    expect(perfilEnBd(username)).toBe('');

    // Ya no entra: el back responde 401 y la UI se queda en /login con su mensaje
    const api = await page.request.post(`${API_PREFIX}/login`, { data: { username, password: PASSWORD } });
    expect(api.status()).toBe(401);
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await loginUI(p, username);
    await expect(p.locator('.toast-message').first()).toContainText((await api.json()).error);
    await expect(p).toHaveURL(/\/login/);
    await ctx.close();
  });

  // H-F3-4 (corregido en back 09e1fe7): usuario desactivado → 401 y la UI se queda en /login.
  test('FLU-USR-003b usuario desactivado no puede hacer login (H-F3-4)', async ({ page }) => {
    const username = unico();
    const { id } = await crearUsuarioApi(username, 'cajero', NORTE);
    await apiFetch(TEST_USERS.adminE2e, 'PUT', `users/${id}`, { is_active: false });

    const api = await page.request.post(`${API_PREFIX}/login`, { data: { username, password: PASSWORD } });
    expect(api.status()).toBe(401);
    await loginUI(page, username);
    await expect(page).toHaveURL(/\/login/);
  });

  test('FLU-USR-004 formulario incompleto no envía nada', async ({ page }) => {
    await abrirAdmin(page);
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/api\/users/.test(r.url()) && posts.push(r.url()));
    const antes = sql(`select count(*) from auth_user`);

    await page.getByLabel('Usuario', { exact: true }).fill(unico());
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(page.getByLabel('Contraseña')).toHaveClass(/ng-invalid/);
    await expect(page.locator('#user-email-error')).toBeVisible();
    await expect(page.locator('#user-password-error')).toBeVisible();
    await expect(page.locator('#user-branch-error')).toBeVisible();
    await expect(page.locator('#user-role-error')).toBeVisible();
    expect(posts).toHaveLength(0);
    expect(sql(`select count(*) from auth_user`)).toBe(antes);
  });

  test('FLU-USR-005 usuario duplicado muestra el mensaje del back', async ({ page }) => {
    const username = unico();
    await crearUsuarioApi(username, 'cajero', NORTE);
    await abrirAdmin(page);
    const antes = sql(`select count(*) from auth_user`);

    await llenarUsuario(page, { username, email: `otro.${username}@trt.com`, sucursal: 'Centro', rol: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(toast(page, 'El nombre de usuario ya existe')).toBeVisible();
    expect(sql(`select count(*) from auth_user`)).toBe(antes);
  });

  // H-F3-5 (corregido en back 09e1fe7): correo repetido → 400 con mensaje y la UI lo muestra.
  test('FLU-USR-005b correo duplicado muestra el mensaje del back (H-F3-5)', async ({ page }) => {
    const username = unico();
    await crearUsuarioApi(username, 'cajero', NORTE);
    await abrirAdmin(page);

    await llenarUsuario(page, { username: `${username}.2`, email: `${username}@trt.com`, sucursal: 'Centro', rol: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await expect(toast(page, /correo/i)).toBeVisible();
    expect(sql(`select count(*) from auth_user where email='${username}@trt.com'`)).toBe('1');
  });

  test('FLU-USR-006 el resumen de /admin cuadra con las sucursales y usuarios en BD', async ({ page }) => {
    const username = unico();
    await crearUsuarioApi(username, 'cajero', NORTE);
    sql(`update auth_user set is_active=0 where username='${username}'`); // al menos un inactivo
    await abrirAdmin(page);

    const resumen = page.getByRole('region', { name: 'Resumen administrativo' });
    const valor = (etiqueta: string) => resumen.getByText(etiqueta, { exact: true }).locator('..').locator('strong');
    await expect(valor('Sucursales')).toHaveText(sql('select count(*) from sucursales_sucursal'));
    await expect(valor('Usuarios')).toHaveText(sql('select count(*) from auth_user'));
    await expect(valor('Usuarios activos')).toHaveText(sql('select count(*) from auth_user where is_active=1'));
    await expect(tablaUsuarios(page).getByRole('row')).toHaveCount(Number(sql('select count(*) from auth_user')) + 1); // + encabezado
    await expect(filaUsuario(page, username)).toContainText('Inactivo');
  });
});
