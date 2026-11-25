/**
 * FLU-ADE — Adeudos y abonos contra backend REAL local (página /debts).
 * Alta → abono parcial → abono final (pagado) y cancelación. Cada prueba crea un cliente `E2E Adeudo <ts>`.
 */
import { expect, Page, test } from '../helpers/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, loginAsReal } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const user = TEST_USERS.anaCentro; // cajera: crea y abona
const encargado = TEST_USERS.gerenteGeneral; // cancelar exige encargado/admin (403 al cajero)
const dialogo = (page: Page) => page.getByRole('dialog');
const fila = (page: Page, texto: string) => page.getByRole('row').filter({ hasText: texto });
const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });

async function abrir(page: Page, quien = user) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  const nombre = `E2E Adeudo ${Date.now()}`;
  const r = await apiFetch(user, 'POST', 'clientes/', { nombre, apellido_paterno: 'Prueba', telefono: '5512345678' });
  expect(r.status).toBe(201);
  await loginAsReal(page, quien);
  await page.goto('/debts');
  await expect(page.getByRole('heading', { name: 'Adeudos', level: 1 })).toBeVisible();
  return nombre;
}

async function crearAdeudo(page: Page, nombre: string, monto: string) {
  await page.getByRole('button', { name: 'Nuevo adeudo' }).click();
  const d = dialogo(page);
  await d.getByLabel('Cliente').selectOption({ label: `${nombre} Prueba` });
  await d.getByLabel('Concepto').fill('Refacciones a crédito');
  await d.getByLabel('Monto del adeudo').fill(monto);
  await d.getByRole('button', { name: 'Registrar' }).click();
  await expect(toast(page, 'Adeudo registrado')).toBeVisible();
  await expect(fila(page, nombre)).toContainText('$100.00');
}

test.describe('Adeudos (back real)', () => {
  test('ADE-001 alta, abono parcial y liquidación', async ({ page }) => {
    const nombre = await abrir(page);
    await crearAdeudo(page, nombre, '100');

    await fila(page, nombre).getByRole('button', { name: 'Abonar' }).click();
    const d = dialogo(page);
    await d.getByLabel('Monto del abono').fill('30');
    await d.getByRole('button', { name: 'Abonar' }).click();
    await expect(toast(page, 'Abono registrado')).toBeVisible();
    await expect(fila(page, nombre)).toContainText('$70.00');

    // Un abono mayor al saldo no se puede enviar.
    await fila(page, nombre).getByRole('button', { name: 'Abonar' }).click();
    await dialogo(page).getByLabel('Monto del abono').fill('71');
    await expect(dialogo(page).getByRole('button', { name: 'Abonar' })).toBeDisabled();
    await dialogo(page).getByLabel('Monto del abono').fill('70');
    await dialogo(page).getByRole('button', { name: 'Abonar' }).click();
    await expect(fila(page, nombre)).toHaveCount(0); // ya no está en "Pendientes"

    await page.getByLabel('Filtrar por estado').selectOption({ label: 'Pagados' });
    await expect(fila(page, nombre)).toContainText('pagado');
  });

  test('ADE-003 el cajero no ve el botón Cancelar', async ({ page }) => {
    const nombre = await abrir(page);
    await crearAdeudo(page, nombre, '100');
    await expect(fila(page, nombre).getByRole('button', { name: 'Abonar' })).toBeVisible();
    await expect(fila(page, nombre).getByRole('button', { name: 'Cancelar' })).toHaveCount(0);
  });

  test('ADE-002 cancelar adeudo (encargado)', async ({ page }) => {
    const nombre = await abrir(page, encargado);
    await crearAdeudo(page, nombre, '100');
    await fila(page, nombre).getByRole('button', { name: 'Cancelar' }).click();
    await dialogo(page).getByRole('button', { name: 'Cancelar adeudo' }).click();
    await expect(toast(page, 'Adeudo cancelado')).toBeVisible();
    await page.getByLabel('Filtrar por estado').selectOption({ label: 'Cancelados' });
    await expect(fila(page, nombre)).toContainText('cancelado');
  });
});
