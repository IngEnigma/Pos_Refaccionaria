/**
 * FLU-REP — Reportes contra backend REAL local (plan-pruebas-flujos-e2e.md §3.12).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * El reporte es un PDF (`GET /api/reporte/?tipo=…`, abre en pestaña nueva): no hay tabla ni estado vacío en pantalla.
 * Se genera por la UI (`/reports`, "Ver Reporte"), se captura la respuesta y se lee su texto con `pdftotext`.
 * No existe un desglose por método de pago: el PDF lista cada venta con su método y total (REP-003 cuadra esas filas).
 * Solo encargado y admin tienen `reporte.ver`; el cajero recibe 403 (REP-005).
 * Las ventas de cada prueba se crean por API, se miden contra el total previo y se borran de la BD al terminar.
 */
import { execFileSync } from 'node:child_process';

import { expect, Page, request, test } from '../helpers/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiLogin, crearVentaApi, DB, fijarStock, loginAsReal, metodosPago, sql, stockDe } from '../helpers/api';
import { API_PREFIX, wakeBackend } from '../helpers/backend';

const CENTRO = 1;
const NORTE = 2;
const A = { clave: 'E2E-002' };
const ANIO = new Date().getFullYear();
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const dd = (n: number) => String(n).padStart(2, '0');
const fecha = (y: number, m: number, d: number) => `${dd(d)}/${dd(m)}/${y} 00:00`;
/** Primer día del mes siguiente (m en 1..12). */
const sigMes = (y: number, m: number) => (m === 12 ? fecha(y + 1, 1, 1) : fecha(y, m + 1, 1));

interface Pdf {
  status: number;
  texto: string;
  tipo: string | null;
}

/** Texto del PDF, con columnas alineadas. */
const pdfATexto = (buf: Buffer) => execFileSync('pdftotext', ['-layout', '-', '-'], { input: buf, encoding: 'utf8' });

/** Reporte directo a la API como `user` (sin UI). */
async function reporteApi(user: { username: string; password: string }, query: string): Promise<Pdf> {
  const { access } = await apiLogin(user);
  const ctx = await request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${access}` } });
  try {
    const res = await ctx.get(`${API_PREFIX}/reporte/?${query}`);
    const tipo = res.headers()['content-type'] ?? null;
    return { status: res.status(), tipo, texto: res.ok() ? pdfATexto(await res.body()) : await res.text() };
  } finally {
    await ctx.dispose();
  }
}

/** Resumen del encabezado: n.º de ventas y monto bruto. */
function resumen(texto: string) {
  const m = texto.match(/TOTAL VENTAS\s+MONTO BRUTO\s+ESTADO\s+(\d+)\s+\$([\d.,]+)/);
  if (!m) throw new Error(`PDF sin resumen:\n${texto.slice(0, 600)}`);
  return { ventas: Number(m[1]), monto: Number(m[2].replace(/,/g, '')) };
}

async function abrirReportes(page: Page, user = TEST_USERS.gerenteGeneral) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Centro de Reportes', level: 1 })).toBeVisible();
}

/** Elige el periodo en la UI, pulsa "Ver Reporte" y devuelve el PDF que respondió el back (la pestaña emergente se cierra). */
async function generar(page: Page, p: { tipo: string; mes?: string; quincena?: string; anio?: number }): Promise<Pdf & { url: string }> {
  await page.getByLabel('Periodo del Reporte').selectOption({ label: p.tipo });
  if (p.mes) await page.getByLabel('Mes', { exact: true }).selectOption({ label: p.mes });
  if (p.quincena) await page.getByLabel('Quincena', { exact: true }).selectOption({ label: p.quincena });
  if (p.anio) await page.getByLabel('Año', { exact: true }).selectOption({ label: String(p.anio) });
  const respuesta = page.waitForResponse((r) => /\/api\/reporte\/?\?/.test(r.url()));
  const emergente = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Ver Reporte' }).click();
  const res = await respuesta;
  const ok = res.ok();
  const out = { status: res.status(), tipo: res.headers()['content-type'] ?? null, texto: ok ? pdfATexto(await res.body()) : '', url: res.url() };
  if (ok) await (await emergente).close();
  return out;
}

test.describe('Reportes flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  let stocks: { centro: number; norte: number };
  let ventas: number[];
  test.beforeEach(() => {
    stocks = { centro: stockDe(A.clave, CENTRO), norte: stockDe(A.clave, NORTE) };
    ventas = [];
  });
  test.afterEach(() => {
    if (ventas.length) {
      sql(`delete from ventas_detalleventa where id_venta_id in (${ventas.join(',')})`);
      sql(`delete from ventas_venta where id in (${ventas.join(',')})`);
    }
    fijarStock(A.clave, CENTRO, stocks.centro);
    fijarStock(A.clave, NORTE, stocks.norte);
  });

  for (const user of [TEST_USERS.gerenteGeneral, TEST_USERS.adminE2e]) {
    test(`FLU-REP-001 el reporte del día sube exactamente por las ventas creadas (${user.username})`, async ({ page }) => {
      const [efectivo, tarjeta] = await metodosPago();
      await abrirReportes(page, user);
      const antes = await generar(page, { tipo: 'Hoy' });
      expect(antes.status).toBe(200);
      const r0 = resumen(antes.texto);

      const v1 = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: A.clave, cantidad: 2 }]);
      const v2 = await crearVentaApi(TEST_USERS.mariaNorte, tarjeta.id, [{ clave: A.clave, cantidad: 1 }]);
      ventas.push(v1.id, v2.id);
      const esperado = Number(v1.total) + Number(v2.total);

      const despues = await generar(page, { tipo: 'Hoy' });
      const r1 = resumen(despues.texto);
      expect(r1.ventas).toBe(r0.ventas + 2);
      expect(r1.monto).toBeCloseTo(r0.monto + esperado, 2);
      expect(despues.texto).toContain(`#${v1.id}`);
      expect(despues.texto).toContain(`#${v2.id}`);
    });
  }

  test('FLU-REP-002 cada tipo de reporte carga sin error y muestra el periodo correcto', async ({ page }) => {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const domingoSig = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7);
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    const prev = ANIO - 1;
    const mesPrev = 2; // febrero del año pasado: 28 días en 2025, sin sorpresas con 29/31

    const casos = [
      { p: { tipo: 'Hoy' }, tipo: 'DAY', desde: fecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()), hasta: fecha(manana.getFullYear(), manana.getMonth() + 1, manana.getDate()) },
      { p: { tipo: 'Semana Actual' }, tipo: 'WEEK', desde: fecha(lunes.getFullYear(), lunes.getMonth() + 1, lunes.getDate()), hasta: fecha(domingoSig.getFullYear(), domingoSig.getMonth() + 1, domingoSig.getDate()) },
      { p: { tipo: 'Quincenal (Específico)', mes: 'Febrero', quincena: 'Primera Quincena', anio: prev }, tipo: 'QUINCENA', desde: fecha(prev, mesPrev, 1), hasta: fecha(prev, mesPrev, 16) },
      { p: { tipo: 'Quincenal (Específico)', mes: 'Febrero', quincena: 'Segunda Quincena', anio: prev }, tipo: 'QUINCENA', desde: fecha(prev, mesPrev, 16), hasta: sigMes(prev, mesPrev) },
      { p: { tipo: 'Mensual (Específico)', mes: 'Febrero', anio: prev }, tipo: 'MONTH', desde: fecha(prev, mesPrev, 1), hasta: sigMes(prev, mesPrev) },
      { p: { tipo: 'Mensual (Específico)', mes: MESES[mesActual - 1][0].toUpperCase() + MESES[mesActual - 1].slice(1), anio: ANIO }, tipo: 'MONTH', desde: fecha(ANIO, mesActual, 1), hasta: sigMes(ANIO, mesActual) },
      { p: { tipo: 'Anual (Específico)', anio: prev }, tipo: 'YEAR', desde: fecha(prev, 1, 1), hasta: fecha(ANIO, 1, 1) },
      { p: { tipo: 'Anual (Específico)', anio: ANIO }, tipo: 'YEAR', desde: fecha(ANIO, 1, 1), hasta: fecha(ANIO + 1, 1, 1) },
    ];

    await abrirReportes(page);
    for (const c of casos) {
      const r = await generar(page, c.p);
      const etiqueta = JSON.stringify(c.p);
      expect(r.status, etiqueta).toBe(200);
      expect(r.tipo, etiqueta).toContain('application/pdf');
      expect(r.texto, etiqueta).toContain('REPORTE DE VENTAS');
      expect(r.texto, etiqueta).toMatch(new RegExp(`\\b${c.tipo}\\b`));
      expect(r.texto, etiqueta).toContain(`${c.desde} — ${c.hasta}`);
      resumen(r.texto);
    }
  });

  test('FLU-REP-003 las ventas Efectivo y Tarjeta del día aparecen con su método y su total', async ({ page }) => {
    const [efectivo, tarjeta] = await metodosPago();
    await abrirReportes(page);
    const r0 = resumen((await generar(page, { tipo: 'Hoy' })).texto);

    const ve = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: A.clave, cantidad: 3 }]);
    const vt = await crearVentaApi(TEST_USERS.carlosCentro, tarjeta.id, [{ clave: A.clave, cantidad: 1 }]);
    ventas.push(ve.id, vt.id);

    const pdf = await generar(page, { tipo: 'Hoy' });
    const fila = (id: number) => pdf.texto.split('\n').find((l) => new RegExp(`#${id}\\b`).test(l)) ?? '';
    expect(fila(ve.id)).toContain(efectivo.tipo);
    expect(fila(ve.id)).toContain(`$${Number(ve.total).toFixed(2)}`);
    expect(fila(vt.id)).toContain(tarjeta.tipo);
    expect(fila(vt.id)).toContain(`$${Number(vt.total).toFixed(2)}`);
    // El total del periodo suma ambas, sin importar el método
    expect(resumen(pdf.texto).monto).toBeCloseTo(r0.monto + Number(ve.total) + Number(vt.total), 2);
  });

  test('FLU-REP-004 un periodo sin ventas muestra el estado vacío', async ({ page }) => {
    await abrirReportes(page);
    const r = await generar(page, { tipo: 'Anual (Específico)', anio: ANIO - 1 });
    expect(r.status).toBe(200);
    expect(resumen(r.texto)).toEqual({ ventas: 0, monto: 0 });
    expect(r.texto).toContain('No se encontraron ventas para este período.');
  });

  test('FLU-REP-005 el cajero no tiene Reportes: sin opción en el menú, la ruta lo regresa al POS y la API responde 403', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    expect((await reporteApi(TEST_USERS.anaCentro, 'tipo=day')).status).toBe(403);

    await loginAsReal(page, TEST_USERS.anaCentro);
    await page.goto('/sales');
    const menu = page.getByRole('navigation').first();
    await expect(menu.getByRole('link', { name: 'Inventario', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Reportes', exact: true })).toHaveCount(0);
    await page.goto('/reports');
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
  });

  test.fixme('FLU-REP-006 el reporte del gerente solo incluye las ventas de su sucursal — H-F4-2', async ({ page }) => {
    // H-F4-2 (back): ReporteVentaService no filtra por sucursal; el encargado recibe también las ventas de Norte.
    const [efectivo] = await metodosPago();
    const vn = await crearVentaApi(TEST_USERS.mariaNorte, efectivo.id, [{ clave: A.clave, cantidad: 1 }]);
    ventas.push(vn.id);
    await abrirReportes(page, TEST_USERS.gerenteGeneral);
    const r = await generar(page, { tipo: 'Hoy' });
    expect(r.texto).not.toContain(`#${vn.id}`);
  });
});
