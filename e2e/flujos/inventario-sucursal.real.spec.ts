/**
 * FLU-IXS — Inventario por sucursal contra backend REAL local (plan-pruebas-flujos-e2e.md §3.5).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * La pantalla `/inventory-by-branch` trabaja con la sucursal del usuario (manager y admin del seed: Centro).
 * Cada prueba mide el stock en BD antes/después y lo restaura al terminar (producto compartido E2E-003).
 * La lista de movimientos no muestra usuario (solo tipo, cantidad, razón y fecha): el usuario se verifica en BD.
 */
import { expect, Page, test } from '../helpers/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { DB, fijarStock, loginAsReal, sql, stockDe } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const P = { clave: 'E2E-003', nombre: 'Bujía E2E' };
const CENTRO = 1;

const fila = (page: Page, clave: string) => page.getByRole('row').filter({ has: page.getByText(clave, { exact: true }) });
const dialogo = (page: Page) => page.getByRole('dialog');
const toast = (page: Page) => page.locator('.toast-message').first();
const unico = (prefijo: string) => `${prefijo} ${Date.now()}`;

async function abrir(page: Page, user: TestUser) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/inventory-by-branch');
  await expect(page.getByRole('heading', { name: 'Inventario por Sucursal' })).toBeVisible();
  await expect(fila(page, P.clave)).toBeVisible({ timeout: 30_000 });
}

/** Abre el diálogo de movimiento del producto, lo llena y lo envía. */
async function registrar(page: Page, tipo: 'Entrada' | 'Salida', cantidad: number, razon: string) {
  await fila(page, P.clave).getByRole('button', { name: /Movimiento/ }).click();
  const d = dialogo(page);
  await d.getByLabel('Tipo de Movimiento').selectOption({ label: tipo });
  await d.getByLabel('Cantidad').fill(String(cantidad));
  await d.getByLabel('Razón').fill(razon);
  await d.getByRole('button', { name: 'Registrar Movimiento' }).click();
}

const stockEnTabla = (page: Page) => fila(page, P.clave).locator('.stock-badge');
const movimientoEnLista = (page: Page, razon: string) => page.locator('.movement-item').filter({ hasText: razon });

test.describe('Inventario por sucursal flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  let inicial: number;
  test.beforeEach(() => {
    inicial = stockDe(P.clave, CENTRO);
  });
  test.afterEach(() => fijarStock(P.clave, CENTRO, inicial));

  for (const user of [TEST_USERS.gerenteGeneral, TEST_USERS.adminE2e]) {
    test(`FLU-IXS-001 ${user.username} ve el inventario de su sucursal`, async ({ page }) => {
      await abrir(page, user);

      // La tabla coincide con el stock de la sucursal en BD
      await expect(stockEnTabla(page)).toHaveText(String(inicial));
      await expect(fila(page, P.clave)).toContainText(P.nombre);
      const enBD = Number(sql(`select count(*) from inventario_stock where id_sucursal_id=${user.sucursalId}`));
      await expect(page.locator('.panel-badge')).toHaveText(`${enBD} productos`);
    });
  }

  test('FLU-IXS-002 entrada: el stock sube y el POS de la sucursal lo refleja', async ({ page }) => {
    await abrir(page, TEST_USERS.gerenteGeneral);
    const razon = unico('E2E entrada');

    await registrar(page, 'Entrada', 7, razon);

    await expect(toast(page)).toContainText('Movimiento registrado correctamente');
    await expect(stockEnTabla(page)).toHaveText(String(inicial + 7));
    expect(stockDe(P.clave, CENTRO)).toBe(inicial + 7);

    // POS de Centro (cajera ana.centro) muestra el nuevo stock
    await loginAsReal(page, TEST_USERS.anaCentro);
    await page.goto('/sales');
    const tarjeta = page.getByRole('article').filter({ has: page.getByRole('heading', { name: P.nombre }) });
    await expect(tarjeta.locator('.product-stock')).toHaveText(String(inicial + 7), { timeout: 30_000 });
  });

  test('FLU-IXS-003 salida: el stock baja', async ({ page }) => {
    await abrir(page, TEST_USERS.adminE2e);

    await registrar(page, 'Salida', 4, unico('E2E salida'));

    await expect(toast(page)).toContainText('Movimiento registrado correctamente');
    await expect(stockEnTabla(page)).toHaveText(String(inicial - 4));
    expect(stockDe(P.clave, CENTRO)).toBe(inicial - 4);
  });

  test('FLU-IXS-004 salida mayor al stock es rechazada y el stock no cambia', async ({ page }) => {
    await abrir(page, TEST_USERS.gerenteGeneral);
    const razon = unico('E2E salida excesiva');
    const movimientosAntes = Number(sql(`select count(*) from inventario_movimientoinventario where razon='${razon}'`));

    await registrar(page, 'Salida', inicial + 1, razon);

    await expect(toast(page)).toContainText(/stock/i);
    expect(stockDe(P.clave, CENTRO)).toBe(inicial);
    expect(Number(sql(`select count(*) from inventario_movimientoinventario where razon='${razon}'`))).toBe(movimientosAntes);
    await expect(stockEnTabla(page)).toHaveText(String(inicial));
  });

  test('FLU-IXS-005 el historial muestra la entrada y la salida con fecha; el usuario queda en BD', async ({ page }) => {
    await abrir(page, TEST_USERS.gerenteGeneral);
    const rEntrada = unico('E2E hist entrada');
    const rSalida = unico('E2E hist salida');

    await registrar(page, 'Entrada', 5, rEntrada);
    await expect(movimientoEnLista(page, rEntrada)).toHaveCount(1);
    await registrar(page, 'Salida', 2, rSalida);
    await expect(movimientoEnLista(page, rSalida)).toHaveCount(1);

    const entrada = movimientoEnLista(page, rEntrada);
    await expect(entrada).toContainText('Entrada');
    await expect(entrada).toContainText('Cantidad: 5');
    await expect(entrada).toContainText(String(new Date().getFullYear()));
    const salida = movimientoEnLista(page, rSalida);
    await expect(salida).toContainText('Salida');
    await expect(salida).toContainText('Cantidad: 2');

    // Usuario y fecha guardados por el back (la UI no rotula el usuario)
    for (const [razon, tipo] of [[rEntrada, 'ENTRADA'], [rSalida, 'SALIDA']]) {
      const fila = sql(
        `select u.username, m.tipo, m.id_sucursal_id, m.fecha from inventario_movimientoinventario m join auth_user u on u.id=m.id_usuario_id where m.razon='${razon}'`,
      ).split('|');
      expect(fila.slice(0, 3)).toEqual([TEST_USERS.gerenteGeneral.username, tipo, String(CENTRO)]);
      expect(fila[3]).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  test('FLU-IXS-006 cajero no entra a la ruta; manager y admin sí', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');

    await loginAsReal(page, TEST_USERS.anaCentro);
    await page.goto('/inventory-by-branch');
    await expect(page).toHaveURL(/\/sales$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Inventario por Sucursal' })).toHaveCount(0);

    for (const user of [TEST_USERS.gerenteGeneral, TEST_USERS.adminE2e]) {
      await loginAsReal(page, user);
      await page.goto('/inventory-by-branch');
      await expect(page).toHaveURL(/\/inventory-by-branch$/);
      await expect(page.getByRole('heading', { name: 'Inventario por Sucursal' })).toBeVisible();
    }
  });
});
