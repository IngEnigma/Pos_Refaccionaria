/**
 * FLU-HIS — Historial de ventas contra backend REAL local (plan-pruebas-flujos-e2e.md §3.3).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Cada prueba crea sus propias ventas por API y las ubica por folio; nada asume el contenido previo.
 * La UI filtra por texto (folio / cajero) y método de pago; no tiene filtro de fecha ni de sucursal.
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS } from '../fixtures/test-users';
import { crearVentaApi, DB, loginAsReal, metodosPago, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const fila = (page: Page, folio: number) => page.getByRole('row').filter({ has: page.getByText(`#${folio}`, { exact: true }) });
const money = (n: number) => `$${n.toFixed(2)}`;

async function abrirHistorial(page: Page, user = TEST_USERS.anaCentro) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Historial de Ventas' })).toBeVisible();
}

test.describe('Historial flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  test('FLU-HIS-001 la venta recién hecha aparece con folio, total, método de pago y cajero', async ({ page }) => {
    const [efectivo] = await metodosPago();
    const venta = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: 'E2E-002', cantidad: 2 }]);

    await abrirHistorial(page);

    const row = fila(page, venta.id);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('ana.centro');
    await expect(row).toContainText(efectivo.tipo);
    await expect(row).toContainText(money(Number(venta.total)));
    await expect(row).toContainText(money(2 * 80 * 1.16));
  });

  test('FLU-HIS-002 filtros (folio/cajero y método de pago) reducen la lista correctamente', async ({ page }) => {
    const [efectivo, tarjeta] = await metodosPago();
    const ventaE = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: 'E2E-003', cantidad: 1 }]);
    const ventaT = await crearVentaApi(TEST_USERS.carlosCentro, tarjeta.id, [{ clave: 'E2E-003', cantidad: 1 }]);
    // Gerente: ve a todos los cajeros por nombre (un cajero no puede listar /users, H-F1-2).
    await abrirHistorial(page, TEST_USERS.gerenteGeneral);
    await expect(fila(page, ventaE.id)).toHaveCount(1);
    await expect(fila(page, ventaT.id)).toHaveCount(1);

    // Método de pago
    await page.getByRole('combobox').selectOption({ label: tarjeta.tipo });
    await expect(fila(page, ventaE.id)).toHaveCount(0);
    await expect(fila(page, ventaT.id)).toHaveCount(1);
    for (const r of await page.locator('tbody tr', { hasText: /#\d+/ }).all()) await expect(r).toContainText(tarjeta.tipo);
    await page.getByRole('combobox').selectOption({ label: 'Todos los métodos' });

    // Cajero
    const buscar = page.getByPlaceholder('Buscar por ID o Usuario...');
    await buscar.fill('carlos.centro');
    await expect(fila(page, ventaT.id)).toHaveCount(1);
    await expect(fila(page, ventaE.id)).toHaveCount(0);

    // Folio exacto
    await buscar.fill(`${ventaE.id}`);
    await expect(fila(page, ventaE.id)).toHaveCount(1);
    await expect(fila(page, ventaT.id)).toHaveCount(0);

    // Sin coincidencias
    await buscar.fill('zzz-no-existe');
    await expect(page.getByText('No se encontraron ventas')).toBeVisible();
  });

  test('FLU-HIS-003 abrir el detalle de una venta desde el historial', async ({ page }) => {
    const [efectivo] = await metodosPago();
    const venta = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [
      { clave: 'E2E-002', cantidad: 2 },
      { clave: 'E2E-003', cantidad: 1 },
    ]);
    await abrirHistorial(page);

    await fila(page, venta.id).getByRole('button', { name: 'Detalle' }).click();

    const modal = page.locator('app-sale-detail-modal');
    await expect(modal.getByRole('heading', { name: `Folio #${venta.id}` })).toBeVisible();
    await expect(modal).toContainText('ana.centro');
    await expect(modal.getByRole('row', { name: /Filtro E2E/ })).toContainText(money(160));
    await expect(modal.getByRole('row', { name: /Bujía E2E/ })).toContainText(money(45));
    await expect(modal.getByRole('row', { name: /^Total/ })).toContainText(money(Number(venta.total)));
    await modal.getByRole('button', { name: 'Cerrar' }).first().click();
    await expect(modal).toHaveCount(0);
  });

  test('FLU-HIS-004 un cajero ve solo las ventas de su sucursal', async ({ page }) => {
    const [efectivo] = await metodosPago();
    const propia = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: 'E2E-003', cantidad: 1 }]);
    const ajena = await crearVentaApi(TEST_USERS.mariaNorte, efectivo.id, [{ clave: 'E2E-003', cantidad: 1 }]);
    expect(ajena.id_sucursal).toBe(2);

    await abrirHistorial(page, TEST_USERS.anaCentro);
    await expect(fila(page, propia.id)).toHaveCount(1);
    await expect(fila(page, ajena.id)).toHaveCount(0);

    // Las filas visibles son exactamente las ventas de la sucursal 1 en la BD
    const enBD = sql('select id from ventas_venta where id_sucursal_id=1').split('\n').map(Number);
    const visibles = (await page.locator('tbody .badge-id').allInnerTexts()).map((t) => Number(t.replace('#', '')));
    expect(visibles.sort((a, b) => a - b)).toEqual(enBD.sort((a, b) => a - b));
  });
});
