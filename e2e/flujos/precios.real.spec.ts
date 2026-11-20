/**
 * FLU-PRE — Precios por sucursal contra backend REAL local (plan-pruebas-flujos-e2e.md §3.6).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Producto: E2E-001 (base $100, Centro con precio propio $120, Norte sin precio). Cada prueba deja a Norte sin
 * precios de ese producto (se limpian sus filas en BD antes y después) para no afectar a otras suites.
 * La pantalla `/branch-pricing` no tiene vista de historial: FLU-PRE-003 lo verifica por API y BD (ver caso).
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, DB, loginAsReal, productoId, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const CLAVE = 'E2E-001';
const NOMBRE = 'Balata E2E';
const CENTRO = 1;
const NORTE = 2;
const NORTE_LABEL = 'Norte — Norte Monterrey - Av Industrial 456';
const CENTRO_LABEL = 'Centro — Centro CDMX - Av Reforma 123';

const row = (page: Page) => page.getByRole('row', { name: new RegExp(NOMBRE) });
const toast = (page: Page) => page.locator('.toast-message').first();
const limpiarNorte = () => {
  sql(`delete from precio_sucursal where id_sucursal_id=${NORTE} and id_producto_id=${productoId(CLAVE)}`);
};
const preciosNorte = () =>
  sql(`select precio_venta, activo from precio_sucursal where id_sucursal_id=${NORTE} and id_producto_id=${productoId(CLAVE)} order by id`);

async function abrirPrecios(page: Page, sucursal = NORTE_LABEL) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, TEST_USERS.adminE2e);
  await page.goto('/branch-pricing');
  await page.getByLabel('Sucursal:').selectOption({ label: sucursal });
  await expect(row(page)).toBeVisible({ timeout: 30_000 });
}

async function fijar(page: Page, precio: string) {
  await row(page).getByRole('button', { name: /Fijar/ }).click();
  const d = page.getByRole('dialog');
  await d.getByLabel('Precio de Venta (MXN)').fill(precio);
  await d.getByRole('button', { name: 'Fijar Precio' }).click();
}

test.describe('Precios por sucursal flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  test.beforeEach(limpiarNorte);
  test.afterEach(limpiarNorte);

  test('FLU-PRE-001 fijar precio en Norte: Norte lo muestra y Centro conserva el suyo', async ({ page }) => {
    await abrirPrecios(page);
    await expect(row(page)).toContainText('Sin precio');

    await fijar(page, '110');

    await expect(toast(page)).toContainText('Precio de sucursal actualizado correctamente');
    await expect(row(page)).toContainText('$110.00');
    await expect(row(page)).toContainText('Activo');
    expect(preciosNorte()).toBe('110|1');

    await page.getByLabel('Sucursal:').selectOption({ label: CENTRO_LABEL });
    await expect(row(page)).toContainText('$120.00');
    await expect(row(page)).not.toContainText('$110.00');
    expect(sql(`select precio_venta from precio_sucursal where id_sucursal_id=${CENTRO} and id_producto_id=${productoId(CLAVE)} and activo=1`)).toBe('120');
  });

  test('FLU-PRE-002 desactivar el precio: el POS de Norte vuelve al precio base', async ({ page }) => {
    await abrirPrecios(page);
    await fijar(page, '110');
    await expect(row(page)).toContainText('$110.00');

    await row(page).getByRole('button', { name: /Desactivar/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Desactivar', exact: true }).click();

    await expect(toast(page)).toContainText('Precio de sucursal desactivado');
    await expect(row(page)).toContainText('Sin precio');
    expect(preciosNorte()).toBe('110|0');

    await loginAsReal(page, TEST_USERS.mariaNorte);
    await page.goto('/sales');
    const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: NOMBRE }) });
    await expect(tarjeta).toContainText('$100.00', { timeout: 30_000 });
    await expect(tarjeta).not.toContainText('Sucursal');
  });

  // La UI no ofrece historial de precios (el caso de uso existe pero ninguna pantalla lo usa): se cubre por API y BD.
  test('FLU-PRE-003 historial de precios: cada cambio queda registrado y solo el último está activo', async ({ page }) => {
    await abrirPrecios(page);
    await fijar(page, '110');
    await expect(row(page)).toContainText('$110.00');
    await fijar(page, '130');
    await expect(row(page)).toContainText('$130.00');

    expect(preciosNorte()).toBe('110|0\n130|1');
    const r = await apiFetch(TEST_USERS.adminE2e, 'GET', `precios-sucursal/historial/?id_producto=${productoId(CLAVE)}&id_sucursal=${NORTE}`);
    expect(r.status).toBe(200);
    const h = r.body as { precio_venta: string; activo: boolean; vigente_desde: string }[];
    expect(h.map((x) => [Number(x.precio_venta), x.activo])).toEqual([[130, true], [110, false]]);
    for (const x of h) expect(x.vigente_desde).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  for (const precio of ['0', '-5']) {
    test(`FLU-PRE-004 precio ${precio} no se puede fijar (no se envía nada)`, async ({ page }) => {
      await abrirPrecios(page);
      const posts: string[] = [];
      page.on('request', (rq) => rq.method() === 'POST' && /precios-sucursal/.test(rq.url()) && posts.push(rq.url()));

      await row(page).getByRole('button', { name: /Fijar/ }).click();
      const d = page.getByRole('dialog');
      const input = d.getByLabel('Precio de Venta (MXN)');
      await input.fill(precio);
      await input.blur();

      await expect(d.getByText('El precio debe ser mayor a $0.00')).toBeVisible();
      await expect(d.getByRole('button', { name: 'Fijar Precio' })).toBeDisabled();
      await page.waitForTimeout(300);
      expect(posts).toHaveLength(0);
      expect(preciosNorte()).toBe('');
    });
  }

  test('FLU-PRE-005 el POS de Norte cobra el precio nuevo en una venta real', async ({ page }) => {
    await abrirPrecios(page);
    await fijar(page, '110');
    await expect(row(page)).toContainText('$110.00');

    await loginAsReal(page, TEST_USERS.mariaNorte);
    await page.goto('/sales');
    const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: NOMBRE }) });
    await expect(tarjeta).toContainText('$110.00', { timeout: 30_000 });
    await expect(tarjeta).toContainText('Sucursal');
    await tarjeta.getByRole('button', { name: 'Añadir' }).click();

    const panel = page.getByRole('complementary', { name: 'Detalle de venta' });
    await expect(panel.locator('.total-amount')).toHaveText(`$${(110 * 1.16).toFixed(2)}`);
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel.getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201);
    const venta = (await res.json()) as { id: number };

    // BD: sucursal Norte, 1 pieza, subtotal con el precio de sucursal ($110, no los $100 base ni los $120 de Centro)
    expect(sql(`select id_sucursal_id from ventas_venta where id=${venta.id}`)).toBe(String(NORTE));
    expect(sql(`select cantidad, subtotal from ventas_detalleventa where id_venta_id=${venta.id}`)).toBe('1|110');
    expect(Number(sql(`select total from ventas_venta where id=${venta.id}`))).toBeCloseTo(110 * 1.16, 2);
  });

  test('FLU-PRE-006 manager y cajero no entran a la ruta; admin sí', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');

    for (const user of [TEST_USERS.gerenteGeneral, TEST_USERS.anaCentro]) {
      const p = await page.context().newPage();
      await loginAsReal(p, user);
      await p.goto('/branch-pricing');
      await expect(p).toHaveURL(/\/sales$/, { timeout: 30_000 });
      await expect(p.getByRole('heading', { name: 'Precios por Sucursal' })).toHaveCount(0);
      await p.close();
    }

    await loginAsReal(page, TEST_USERS.adminE2e);
    await page.goto('/branch-pricing');
    await expect(page).toHaveURL(/\/branch-pricing$/);
    await expect(page.getByRole('heading', { name: 'Precios por Sucursal' })).toBeVisible();
  });
});
