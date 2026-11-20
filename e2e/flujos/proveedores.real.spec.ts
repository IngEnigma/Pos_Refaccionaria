/**
 * FLU-PRO — Proveedores contra backend REAL local (plan-pruebas-flujos-e2e.md §3.8).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Permisos del back: el cajero solo crea/lista; editar y eliminar exigen encargado o admin.
 * El catálogo de proveedores es global (no por sucursal) y el back no rechaza duplicados:
 * FLU-PRO-004 usa el rechazo real alcanzable (404 al editar un proveedor ya borrado).
 * Cada prueba crea proveedores `E2E Proveedor <timestamp>` y los borra de la BD al terminar.
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { apiFetch, DB, loginAsReal, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const PREFIJO = 'E2E Proveedor';
const unico = () => `${PREFIJO} ${Date.now()}`;
const fila = (page: Page, nombre: string) => page.getByRole('row').filter({ hasText: nombre });
const dialogo = (page: Page) => page.getByRole('dialog');
const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });
const enBd = (nombre: string) => sql(`select telefono||'|'||correo||'|'||direccion from producto_proveedor where nombre='${nombre}'`);

async function abrir(page: Page, user: TestUser = TEST_USERS.gerenteGeneral) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/suppliers');
  await expect(page.getByRole('heading', { name: 'Proveedores', level: 1 })).toBeVisible();
}

async function crearProveedor(nombre: string) {
  const r = await apiFetch(TEST_USERS.gerenteGeneral, 'POST', 'proveedores/', {
    nombre,
    telefono: '5512345678',
    correo: 'e2e.proveedor@trt.com',
    direccion: 'Calle E2E 1',
  });
  expect(r.status).toBe(201);
}

async function llenar(page: Page, v: { nombre?: string; direccion?: string; telefono?: string; correo?: string }) {
  const d = dialogo(page);
  if (v.nombre !== undefined) await d.getByLabel('Nombre / Razón Social').fill(v.nombre);
  if (v.direccion !== undefined) await d.getByLabel('Dirección').fill(v.direccion);
  if (v.telefono !== undefined) await d.getByLabel('Teléfono').fill(v.telefono);
  if (v.correo !== undefined) await d.getByLabel('Correo Electrónico').fill(v.correo);
}

test.describe('Proveedores flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  test.afterEach(() => {
    sql(`delete from producto_proveedor where nombre like '${PREFIJO}%'`);
  });

  test('FLU-PRO-001 crear, editar y eliminar un proveedor', async ({ page }) => {
    const nombre = unico();
    await abrir(page);

    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();
    await llenar(page, { nombre, direccion: 'Av. Industrial 45', telefono: '5512345678', correo: 'ventas@e2e-proveedor.com' });
    await dialogo(page).getByRole('button', { name: 'Registrar Proveedor' }).click();
    await expect(toast(page, 'Proveedor registrado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toContainText('ventas@e2e-proveedor.com');
    expect(enBd(nombre)).toBe('5512345678|ventas@e2e-proveedor.com|Av. Industrial 45');

    await fila(page, nombre).getByRole('button', { name: 'Editar' }).click();
    await dialogo(page).getByLabel('Teléfono').fill('5599998888');
    await dialogo(page).getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(toast(page, 'Proveedor actualizado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toContainText('5599998888');
    expect(enBd(nombre)).toBe('5599998888|ventas@e2e-proveedor.com|Av. Industrial 45');

    await fila(page, nombre).getByRole('button', { name: 'Eliminar' }).click();
    await dialogo(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect(toast(page, 'Proveedor eliminado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toHaveCount(0);
    expect(enBd(nombre)).toBe('');
  });

  test('FLU-PRO-002 cancelar la eliminación no borra', async ({ page }) => {
    const nombre = unico();
    await crearProveedor(nombre);
    await abrir(page);

    await fila(page, nombre).getByRole('button', { name: 'Eliminar' }).click();
    await expect(dialogo(page)).toContainText(nombre);
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialogo(page)).toHaveCount(0);
    await expect(fila(page, nombre)).toHaveCount(1);
    expect(enBd(nombre)).not.toBe('');
  });

  test('FLU-PRO-003 validaciones del formulario: no envía nada inválido', async ({ page }) => {
    const nombre = unico();
    await abrir(page);
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/proveedores/.test(r.url()) && posts.push(r.url()));

    await page.getByRole('button', { name: 'Registrar Proveedor' }).click();
    const guardar = dialogo(page).getByRole('button', { name: 'Registrar Proveedor' });
    await expect(guardar).toBeDisabled(); // vacío

    await llenar(page, { nombre: 'ab', direccion: ' ', telefono: '55-12ab', correo: 'no-es-correo' });
    await dialogo(page).getByLabel('Nombre / Razón Social').blur();
    await expect(dialogo(page)).toContainText('El nombre es requerido (mín. 3 caracteres)');
    await expect(dialogo(page)).toContainText('Teléfono inválido (solo números)');
    await expect(dialogo(page)).toContainText('Correo electrónico inválido');
    await expect(guardar).toBeDisabled();

    await llenar(page, { nombre, direccion: 'Calle 1', telefono: '5512345678', correo: 'ok@e2e-proveedor.com' });
    await expect(guardar).toBeEnabled();
    expect(posts).toHaveLength(0);
    await guardar.click();
    await expect(toast(page, 'Proveedor registrado correctamente')).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test('FLU-PRO-004 el back rechaza (proveedor ya borrado → 404) y la UI muestra su mensaje', async ({ page }) => {
    // El back no tiene regla de duplicados (mismo nombre se acepta); el rechazo real alcanzable es el 404.
    const nombre = unico();
    await crearProveedor(nombre);
    await abrir(page);
    await expect(fila(page, nombre)).toHaveCount(1);

    sql(`delete from producto_proveedor where nombre='${nombre}'`); // otro usuario lo eliminó con la lista abierta
    await fila(page, nombre).getByRole('button', { name: 'Editar' }).click();
    await dialogo(page).getByLabel('Teléfono').fill('5500000000');
    await dialogo(page).getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(toast(page, /no encontrado/i)).toBeVisible();
    expect(enBd(nombre)).toBe('');
  });

  test('FLU-PRO-004b el cajero crea pero no ve editar ni eliminar (el back los rechaza con 403, H-F3-2)', async ({ page }) => {
    const nombre = unico();
    await crearProveedor(nombre);
    await abrir(page, TEST_USERS.anaCentro);

    await expect(page.getByRole('button', { name: 'Registrar Proveedor' })).toBeVisible();
    await expect(fila(page, nombre)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);
  });
});
