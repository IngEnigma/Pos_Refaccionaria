/**
 * FLU-DIA — Cadena "día completo" @smoke contra backend REAL local (plan-pruebas-flujos-e2e.md §5).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos   (o solo:  --grep @smoke)
 *
 * Serial a propósito: cada paso usa lo que dejó el anterior. Todo es de esta corrida (sucursal, productos, usuarios `e2e.dia.*`)
 * y se borra de la BD en `afterAll`; no toca los datos del seed.
 *
 *   01 admin crea la sucursal (UI)                    05 cajero entra por UI y vende en Efectivo (quita un artículo)
 *   02 admin da de alta 2 productos con stock (API)   06 cajero vende con Tarjeta
 *   03 admin fija el precio de sucursal (UI)          07 stock, historial y reporte del día cuadran
 *   04 admin crea cajero (UI) y encargado (API)       08 el cajero baja A del umbral → LOW_STOCK
 *                                                     09 el encargado registra una entrada (UI) → alerta resuelta
 *
 * Alta de producto por API y no por UI: la pantalla de alta de producto está rota (H-F6-1, ver `inventario.real.spec.ts`, FLU-INV-001b).
 * El paso 09 usa `/inventory-by-branch` del encargado de la nueva sucursal (`/manager` es maqueta, H-F4-1).
 */
import { execFileSync } from 'node:child_process';

import { expect, Page, request, test } from '../helpers/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, apiLogin, DB, loginAsReal, metodosPago, sql } from '../helpers/api';
import { API_PREFIX, wakeBackend } from '../helpers/backend';

const ADMIN = TEST_USERS.adminE2e;
const PASSWORD = 'Secreta123';
const UMBRAL = 10;
const IVA = 1.16;

const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });
const money = (n: number) => `$${n.toFixed(2)}`;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Detalle de venta' });
const tarjetaPos = (page: Page, nombre: string) =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre }) });
const linea = (page: Page, nombre: string) => panel(page).locator('app-cart-item').filter({ hasText: nombre });

const pdfATexto = (buf: Buffer) => execFileSync('pdftotext', ['-layout', '-', '-'], { input: buf, encoding: 'utf8' });

/** Reporte del día como admin directo a la API: n.º de ventas y monto bruto del encabezado del PDF. */
async function reporteHoy() {
  const { access } = await apiLogin(ADMIN);
  const ctx = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${access}` } });
  try {
    const res = await ctx.get(`${API_PREFIX}/reporte/?tipo=day`);
    expect(res.status()).toBe(200);
    return resumen(pdfATexto(await res.body()));
  } finally {
    await ctx.dispose();
  }
}

function resumen(texto: string) {
  const m = texto.match(/TOTAL VENTAS\s+MONTO BRUTO\s+ESTADO\s+(\d+)\s+\$([\d.,]+)/);
  if (!m) throw new Error(`PDF sin resumen:\n${texto.slice(0, 600)}`);
  return { texto, ventas: Number(m[1]), monto: Number(m[2].replace(/,/g, '')) };
}

test.describe.serial('FLU-DIA @smoke día completo: sucursal, productos, cajero, ventas, alertas y entrada', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  const ts = Date.now();
  const SUC = `E2E DIA ${ts}`;
  const UBIC = `Av. Día Completo ${ts}`;
  const CAJERO = { username: `e2e.dia.${ts}`, password: PASSWORD };
  const ENCARGADO = { username: `e2e.dia.enc.${ts}`, password: PASSWORD };
  const A = { clave: `E2E-DIA-${ts}-A`, nombre: `Prod DIA A ${ts}`, base: 100, sucursal: 120, stock: 14 };
  const B = { clave: `E2E-DIA-${ts}-B`, nombre: `Prod DIA B ${ts}`, base: 40, stock: 50 };

  let sucId: number;
  let proveedorId: number;
  let idA: number;
  let idB: number;
  let efectivo: { id: number; tipo: string };
  let tarjeta: { id: number; tipo: string };
  let base: { ventas: number; monto: number };
  const ventas: { id: number; total: number; metodo: string }[] = [];

  const stock = (id: number) => Number(sql(`select cantidad from inventario_stock where id_producto_id=${id} and id_sucursal_id=${sucId}`));
  const alertas = (resueltas: boolean) =>
    Number(sql(`select count(*) from notifications_notification where ref_producto_id=${idA} and ref_sucursal_id=${sucId} and tipo='warning' and resuelta_en is ${resueltas ? 'not null' : 'null'}`));

  test.beforeAll(async () => {
    [efectivo, tarjeta] = [(await metodosPago()).find((m) => /efectivo/i.test(m.tipo))!, (await metodosPago()).find((m) => /tarjeta/i.test(m.tipo))!];
    expect(efectivo && tarjeta).toBeTruthy();
  });

  test.afterAll(() => {
    const productos = `select id from producto_producto where clave like 'E2E-DIA-${ts}-%'`;
    const usuarios = `select id from auth_user where username like 'e2e.dia.%${ts}'`;
    const suc = `select id from sucursales_sucursal where nombre_sucursal='${SUC}'`;
    sql(`delete from ventas_detalleventa where id_venta_id in (select id from ventas_venta where id_sucursal_id in (${suc}))`);
    sql(`delete from ventas_venta where id_sucursal_id in (${suc})`);
    sql(`delete from notifications_notification where ref_sucursal_id in (${suc}) or ref_producto_id in (${productos})`);
    sql(`delete from inventario_movimientoinventario where id_producto_id in (${productos}) or id_sucursal_id in (${suc})`);
    sql(`delete from inventario_stock where id_producto_id in (${productos}) or id_sucursal_id in (${suc})`);
    sql(`delete from precio_sucursal where id_producto_id in (${productos}) or id_sucursal_id in (${suc})`);
    sql(`delete from producto_producto where clave like 'E2E-DIA-${ts}-%'`);
    sql(`delete from usuario_perfil where usuario_id in (${usuarios})`);
    sql(`delete from auth_user where username like 'e2e.dia.%${ts}'`);
    sql(`delete from sucursales_sucursal where nombre_sucursal='${SUC}'`);
    if (proveedorId) sql(`delete from producto_proveedor where id=${proveedorId}`);
  });

  test('FLU-DIA-01 admin crea la sucursal nueva por la UI', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, ADMIN);
    await page.goto('/branches');
    await expect(page.getByRole('heading', { name: 'Sucursales', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    const d = page.getByRole('dialog');
    await d.getByLabel('Nombre de la Sucursal').fill(SUC);
    await d.getByLabel('Ubicación').fill(UBIC);
    await d.getByLabel('Código Postal').fill('06000');
    await d.getByLabel('Teléfono').fill('5512345678');
    await d.getByLabel('Correo Electrónico').fill(`dia.${ts}@trt.com`);
    await d.getByRole('button', { name: 'Registrar Sucursal' }).click();

    await expect(toast(page, 'Sucursal registrada correctamente')).toBeVisible();
    await expect(page.locator('app-branch-card').filter({ hasText: SUC })).toContainText(UBIC);
    sucId = Number(sql(`select id from sucursales_sucursal where nombre_sucursal='${SUC}'`));
    expect(sucId).toBeGreaterThan(3);
  });

  test('FLU-DIA-02 admin da de alta dos productos con stock en la sucursal nueva (por API: la UI de alta está en fixme, H-F6-1)', async () => {
    const prov = await apiFetch(ADMIN, 'POST', 'proveedores/', { nombre: `E2E-PROV-DIA-${ts}`, telefono: '5511112222', correo: `prov.dia.${ts}@trt.com`, direccion: 'Calle E2E 1' });
    expect(prov.status).toBe(201);
    proveedorId = prov.body.id;

    for (const p of [A, B]) {
      const r = await apiFetch(ADMIN, 'POST', 'productos/', {
        clave: p.clave, nombre: p.nombre, descripcion: 'día completo', codigo_barras: `750${p.clave.slice(-8)}`, precio_venta: p.base,
        marca: 'E2E', costo: 10, id_tipo: 1, id_proveedor: proveedorId, codigoSAT: '',
      });
      expect(r.status, JSON.stringify(r.body)).toBe(201);
      p === A ? (idA = r.body.id) : (idB = r.body.id);
      const mov = await apiFetch(ADMIN, 'POST', 'movimientos-inventario/', { id_producto: r.body.id, id_sucursal: sucId, cantidad: p.stock, tipo_movimiento: 'ENTRADA', razon: 'E2E dia alta' });
      expect(mov.status, JSON.stringify(mov.body)).toBe(201);
    }
    expect([stock(idA), stock(idB)]).toEqual([A.stock, B.stock]);
    // Solo en la sucursal nueva: ninguna de las 3 del seed tiene fila de stock de estos productos
    expect(sql(`select count(*) from inventario_stock where id_producto_id in (${idA},${idB}) and id_sucursal_id<>${sucId}`)).toBe('0');
  });

  test('FLU-DIA-03 admin fija en la UI el precio de sucursal de A ($120 vs base $100)', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, ADMIN);
    await page.goto('/branch-pricing');
    await page.getByLabel('Sucursal:').selectOption({ label: `${SUC} — ${UBIC}` });
    const fila = page.getByRole('row', { name: new RegExp(A.nombre) });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await expect(fila).toContainText('Sin precio');

    await fila.getByRole('button', { name: /Fijar/ }).click();
    const d = page.getByRole('dialog');
    await d.getByLabel('Precio de Venta (MXN)').fill(String(A.sucursal));
    await d.getByRole('button', { name: 'Fijar Precio' }).click();

    await expect(toast(page, 'Precio de sucursal actualizado correctamente')).toBeVisible();
    await expect(fila).toContainText(money(A.sucursal));
    expect(sql(`select precio_venta||'|'||activo from precio_sucursal where id_sucursal_id=${sucId} and id_producto_id=${idA}`)).toBe(`${A.sucursal}|1`);
    // B no tiene precio propio: usa el base
    await expect(page.getByRole('row', { name: new RegExp(B.nombre) })).toContainText('Sin precio');
  });

  test('FLU-DIA-04 admin crea el cajero por la UI (y un encargado por API) para la sucursal nueva', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, ADMIN);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Sucursales y usuarios', level: 1 })).toBeVisible();

    await page.getByLabel('Usuario', { exact: true }).fill(CAJERO.username);
    await page.getByLabel('Correo', { exact: true }).nth(1).fill(`${CAJERO.username}@trt.com`);
    await page.getByLabel('Contraseña').fill(CAJERO.password);
    await page.getByLabel('Sucursal', { exact: true }).selectOption({ label: SUC });
    await page.getByLabel('Rol').selectOption({ label: 'Cajero' });
    await page.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(toast(page, 'Usuario creado correctamente.')).toBeVisible();
    expect(sql(`select p.rol||'|'||p.id_sucursal_id from usuario_perfil p join auth_user u on u.id=p.usuario_id where u.username='${CAJERO.username}'`)).toBe(`cajero|${sucId}`);

    const enc = await apiFetch(ADMIN, 'POST', 'users', { username: ENCARGADO.username, password: ENCARGADO.password, email: `${ENCARGADO.username}@trt.com`, is_active: true, id_sucursal: sucId, rol: 'encargado' });
    expect(enc.status, JSON.stringify(enc.body)).toBe(201);
  });

  test('FLU-DIA-05 el cajero entra por la UI y vende en Efectivo; quita un artículo del carrito y se cobra el precio de sucursal', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    base = await reporteHoy(); // punto de partida del reporte del día

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(CAJERO.username);
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(CAJERO.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(tarjetaPos(page, A.nombre)).toBeVisible({ timeout: 30_000 });
    await expect(tarjetaPos(page, A.nombre)).toContainText(String(A.sucursal)); // precio de sucursal, no el base

    await tarjetaPos(page, A.nombre).getByRole('button', { name: 'Añadir' }).click();
    await tarjetaPos(page, B.nombre).getByRole('button', { name: 'Añadir' }).click();
    await expect(linea(page, B.nombre)).toBeVisible();
    await page.getByRole('button', { name: `Quitar ${B.nombre} del carrito` }).click();
    await expect(linea(page, B.nombre)).toHaveCount(0);

    const total = A.sucursal * IVA;
    await expect(panel(page).locator('.total-amount')).toHaveText(money(total));
    await panel(page).getByRole('button', { name: efectivo.tipo, exact: true }).click();
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel(page).getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201);
    const venta = (await res.json()) as { id: number };
    ventas.push({ id: venta.id, total, metodo: efectivo.tipo });

    await expect(page.locator('.total-value')).toHaveText(`MX${money(total)}`);
    expect(sql(`select id_metodo_pago_id||'|'||id_sucursal_id||'|'||(select username from auth_user where id=id_usuario_id) from ventas_venta where id=${venta.id}`)).toBe(`${efectivo.id}|${sucId}|${CAJERO.username}`);
    expect(sql(`select count(*) from ventas_detalleventa where id_venta_id=${venta.id}`)).toBe('1'); // B se quitó
    expect(stock(idA)).toBe(A.stock - 1);
    expect(stock(idB)).toBe(B.stock);
  });

  test('FLU-DIA-06 el cajero vende en Tarjeta (A x1 y B x2)', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, { ...TEST_USERS.anaCentro, ...CAJERO });
    await page.goto('/sales');
    await expect(tarjetaPos(page, A.nombre)).toBeVisible({ timeout: 30_000 });

    await tarjetaPos(page, A.nombre).getByRole('button', { name: 'Añadir' }).click();
    await tarjetaPos(page, B.nombre).getByRole('button', { name: 'Añadir' }).click();
    await linea(page, B.nombre).getByRole('button', { name: '+' }).click();
    await expect(linea(page, B.nombre).getByTitle('Cantidad')).toHaveText('2');

    const total = (A.sucursal + 2 * B.base) * IVA;
    await expect(panel(page).locator('.total-amount')).toHaveText(money(total));
    await panel(page).getByRole('button', { name: tarjeta.tipo, exact: true }).click();
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel(page).getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201);
    const venta = (await res.json()) as { id: number };
    ventas.push({ id: venta.id, total, metodo: tarjeta.tipo });

    expect(sql(`select id_metodo_pago_id||'|'||id_sucursal_id from ventas_venta where id=${venta.id}`)).toBe(`${tarjeta.id}|${sucId}`);
    expect(sql(`select count(*) from ventas_detalleventa where id_venta_id=${venta.id}`)).toBe('2');
    expect(stock(idA)).toBe(A.stock - 2);
    expect(stock(idB)).toBe(B.stock - 2);
  });

  test('FLU-DIA-07 stock, historial y reporte del día reflejan las dos ventas', async ({ page, browser }) => {
    expect(ventas).toHaveLength(2);
    expect([stock(idA), stock(idB)]).toEqual([A.stock - 2, B.stock - 2]);

    // Historial del cajero: sus dos ventas, cada una con su método y total
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, { ...TEST_USERS.anaCentro, ...CAJERO });
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Historial de Ventas' })).toBeVisible();
    for (const v of ventas) {
      const fila = page.getByRole('row').filter({ has: page.getByText(`#${v.id}`, { exact: true }) });
      await expect(fila).toHaveCount(1);
      await expect(fila).toContainText(v.metodo);
      await expect(fila).toContainText(money(v.total));
      await expect(fila).toContainText(CAJERO.username);
    }

    // Reporte del día (admin, por la UI): +2 ventas y el monto sube exactamente por la suma
    const adminPage = await browser.newContext().then((c) => c.newPage());
    await loginAsReal(adminPage, ADMIN);
    await adminPage.goto('/reports');
    await expect(adminPage.getByRole('heading', { name: 'Centro de Reportes', level: 1 })).toBeVisible();
    await adminPage.getByLabel('Periodo del Reporte').selectOption({ label: 'Hoy' });
    const respuesta = adminPage.waitForResponse((r) => /\/api\/reporte\/?\?/.test(r.url()));
    const emergente = adminPage.waitForEvent('popup');
    await adminPage.getByRole('button', { name: 'Ver Reporte' }).click();
    const res = await respuesta;
    expect(res.status()).toBe(200);
    const r1 = resumen(pdfATexto(await res.body()));
    await (await emergente).close();
    await adminPage.context().close();

    expect(r1.ventas).toBe(base.ventas + 2);
    expect(r1.monto).toBeCloseTo(base.monto + ventas[0].total + ventas[1].total, 2);
    for (const v of ventas) expect(r1.texto).toContain(`#${v.id}`);
  });

  test('FLU-DIA-08 el cajero vende hasta dejar A bajo el umbral: aparece LOW_STOCK', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    expect(stock(idA)).toBe(A.stock - 2); // 12
    expect(alertas(false)).toBe(0);
    await loginAsReal(page, { ...TEST_USERS.anaCentro, ...CAJERO });
    await page.goto('/sales');
    await expect(tarjetaPos(page, A.nombre)).toBeVisible({ timeout: 30_000 });

    await tarjetaPos(page, A.nombre).getByRole('button', { name: 'Añadir' }).click();
    await linea(page, A.nombre).getByRole('button', { name: '+' }).click();
    await linea(page, A.nombre).getByRole('button', { name: '+' }).click();
    await expect(linea(page, A.nombre).getByTitle('Cantidad')).toHaveText('3');
    await panel(page).getByRole('button', { name: efectivo.tipo, exact: true }).click();
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel(page).getByRole('button', { name: 'Procesar transacción' }).click();
    expect((await posted).status()).toBe(201);

    expect(stock(idA)).toBe(A.stock - 5); // 9 < umbral
    expect(stock(idA)).toBeLessThan(UMBRAL);
    expect(alertas(false)).toBeGreaterThan(0);

    await page.goto('/notifications');
    const item = page.getByRole('article').filter({ hasText: A.nombre });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('Stock bajo');
    await expect(item).toContainText(`quedan ${A.stock - 5} unidades en ${SUC}`);
  });

  test('FLU-DIA-09 el encargado registra una entrada de A por la UI: la alerta queda resuelta en BD', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const pendientes = alertas(false);
    expect(pendientes).toBeGreaterThan(0);

    await loginAsReal(page, { ...TEST_USERS.gerenteGeneral, ...ENCARGADO });
    await page.goto('/inventory-by-branch');
    const fila = page.getByRole('row').filter({ has: page.getByText(A.clave, { exact: true }) });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await fila.getByRole('button', { name: /Movimiento/ }).click();
    const d = page.getByRole('dialog');
    await d.getByLabel('Tipo de Movimiento').selectOption({ label: 'Entrada' });
    await d.getByLabel('Cantidad').fill('5');
    await d.getByLabel('Razón').fill(`E2E dia entrada ${ts}`);
    await d.getByRole('button', { name: 'Registrar Movimiento' }).click();
    await expect(toast(page, 'Movimiento registrado correctamente')).toBeVisible();

    expect(stock(idA)).toBe(A.stock); // 9 + 5 = 14 ≥ umbral
    expect(alertas(false)).toBe(0);
    expect(alertas(true)).toBe(pendientes); // resueltas, no borradas (historial)
    expect(sql(`select count(*) from inventario_movimientoinventario where id_producto_id=${idA} and id_sucursal_id=${sucId} and razon like 'E2E dia entrada%' and id_usuario_id=(select id from auth_user where username='${ENCARGADO.username}')`)).toBe('1');
  });
});
