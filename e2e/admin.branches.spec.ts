/**
 * SISTEMA E2E — CRUD de sucursales (SIS-030). Con mocks, sin Render.
 * El backend se simula con estado (GET/POST/PUT/DELETE sobre /sucursales).
 * Las tarjetas no tienen rol ni nombre accesible (H-50): se acotan por <app-branch-card>.
 */
import { test, expect, Page } from '@playwright/test';

import { BRANCHES } from './fixtures/api-data';
import { loginAs, mockApi } from './helpers/backend';

const toast = (page: Page, texto: string | RegExp) =>
  page.locator('.toast-message').filter({ hasText: texto });
const card = (page: Page, nombre: string) =>
  page.locator('app-branch-card').filter({ has: page.getByRole('heading', { name: nombre, level: 3 }) });

async function setup(page: Page) {
  await loginAs(page, 'admin');
  const sucursales = BRANCHES.map((b) => ({ ...b }));
  await mockApi(page, '/sucursales', () => sucursales, 200, 'GET');
  const posts = await mockApi(
    page,
    '/sucursales',
    (call) => {
      const nueva = { id: 3, codigo_sucursal: 'SUC-003', ...(call.body as object) } as (typeof BRANCHES)[number];
      sucursales.push(nueva);
      return nueva;
    },
    201,
    'POST',
  );
  const puts = await mockApi(
    page,
    '/sucursales/\\d+',
    (call) => {
      const id = Number(call.url.match(/sucursales\/(\d+)/)![1]);
      const actual = sucursales.find((s) => s.id === id)!;
      Object.assign(actual, call.body);
      return actual;
    },
    200,
    'PUT',
  );
  const deletes = await mockApi(
    page,
    '/sucursales/\\d+',
    (call) => {
      const id = Number(call.url.match(/sucursales\/(\d+)/)![1]);
      sucursales.splice(sucursales.findIndex((s) => s.id === id), 1);
      return null;
    },
    204,
    'DELETE',
  );
  return { posts, puts, deletes };
}

async function fillBranchForm(page: Page, v: { nombre: string; ubicacion: string; cp: string; tel: string; correo: string }) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre de la Sucursal').fill(v.nombre);
  await dialog.getByLabel('Ubicación').fill(v.ubicacion);
  await dialog.getByLabel('Código Postal').fill(v.cp);
  await dialog.getByLabel('Teléfono').fill(v.tel);
  await dialog.getByLabel('Correo Electrónico').fill(v.correo);
}

test.describe('Sucursales — SIS-030', () => {
  test('lista las sucursales del backend', async ({ page }) => {
    await setup(page);
    // H-51: el icono "Mail" no estaba registrado y rompía la tarjeta y el formulario.
    const errores: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
    await page.goto('/branches');

    await expect(card(page, 'Centro')).toContainText('Av Reforma 123');
    await expect(card(page, 'Norte')).toContainText('norte@trt.com');
    expect(errores.filter((e) => e.includes('icon has not been provided'))).toEqual([]);
  });

  test('crea una sucursal, la edita y la elimina; el listado refleja cada cambio', async ({ page }) => {
    const { posts, puts, deletes } = await setup(page);
    await page.goto('/branches');
    await expect(card(page, 'Centro')).toBeVisible();

    // Crear
    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    await fillBranchForm(page, { nombre: 'Sur', ubicacion: 'Calle Sur 9', cp: '08000', tel: '5500001111', correo: 'sur@trt.com' });
    await page.getByRole('dialog').getByRole('button', { name: 'Registrar Sucursal' }).click();
    await expect(toast(page, 'Sucursal registrada correctamente')).toBeVisible();
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({
      nombre_sucursal: 'Sur',
      ubicacion: 'Calle Sur 9',
      codigo_postal: '08000',
      numero_telefono: '5500001111',
      correo_electronico: 'sur@trt.com',
    });
    await expect(card(page, 'Sur')).toContainText('Calle Sur 9');

    // Editar
    await card(page, 'Sur').getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Sucursal' })).toBeVisible();
    await page.getByRole('dialog').getByLabel('Nombre de la Sucursal').fill('Sur Oriente');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(toast(page, 'Sucursal actualizada correctamente')).toBeVisible();
    expect(puts).toHaveLength(1);
    expect(puts[0].url).toMatch(/\/sucursales\/3\/?$/);
    expect(puts[0].body).toMatchObject({ nombre_sucursal: 'Sur Oriente' });
    await expect(card(page, 'Sur Oriente')).toBeVisible();
    await expect(card(page, 'Sur').getByRole('heading', { name: 'Sur', exact: true })).toHaveCount(0);

    // Eliminar (con confirmación)
    await card(page, 'Sur Oriente').getByRole('button', { name: 'Eliminar' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Eliminar Sucursal' })).toBeVisible();
    await expect(confirm).toContainText('"Sur Oriente"');
    await confirm.getByRole('button', { name: 'Eliminar' }).click();
    await expect(toast(page, 'Sucursal eliminada correctamente')).toBeVisible();
    expect(deletes).toHaveLength(1);
    expect(deletes[0].url).toMatch(/\/sucursales\/3\/?$/);
    await expect(card(page, 'Sur Oriente')).toHaveCount(0);
    await expect(card(page, 'Centro')).toBeVisible();
  });

  test('cancelar la confirmación no elimina la sucursal', async ({ page }) => {
    const { deletes } = await setup(page);
    await page.goto('/branches');

    await card(page, 'Norte').getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(deletes).toHaveLength(0);
    await expect(card(page, 'Norte')).toBeVisible();
  });

  test('valida el formulario: nombre corto y campos vacíos no se pueden registrar', async ({ page }) => {
    const { posts } = await setup(page);
    await page.goto('/branches');

    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    const dialog = page.getByRole('dialog');
    const submit = dialog.getByRole('button', { name: 'Registrar Sucursal' });
    await expect(submit).toBeDisabled();

    await dialog.getByLabel('Nombre de la Sucursal').fill('Su');
    await dialog.getByLabel('Nombre de la Sucursal').blur();
    await expect(dialog.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeVisible();

    await dialog.getByLabel('Teléfono').fill('abc');
    await dialog.getByLabel('Teléfono').blur();
    await expect(dialog.getByText('Teléfono inválido (solo números)')).toBeVisible();
    await expect(submit).toBeDisabled();
    expect(posts).toHaveLength(0);
  });

  test('un nombre duplicado rechazado por el backend muestra su mensaje (H-42)', async ({ page }) => {
    await setup(page);
    await mockApi(page, '/sucursales', { error: 'Ya existe una sucursal con ese nombre' }, 400, 'POST');
    await page.goto('/branches');

    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    await fillBranchForm(page, { nombre: 'Centro', ubicacion: 'Otra 1', cp: '06000', tel: '5512345678', correo: 'c2@trt.com' });
    await page.getByRole('dialog').getByRole('button', { name: 'Registrar Sucursal' }).click();

    await expect(toast(page, 'Ya existe una sucursal con ese nombre')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Centro', level: 3 })).toHaveCount(1);
  });
});
