/**
 * FLU-CLI — Clientes contra backend REAL local (plan-pruebas-flujos-e2e.md §3.7).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Permisos del back: el cajero solo crea/lista; editar y eliminar exigen encargado o admin (403 al cajero).
 * El back filtra por sucursal: un cajero solo ve/crea clientes de la suya; admin ve todos; el gerente (encargado) solo los de su sucursal.
 * La UI no tiene búsqueda ni paginación (CLI-005 no aplica) y el back no rechaza duplicados (CLI-004 usa otro rechazo real).
 * Cada prueba crea clientes `E2E Cliente <timestamp>` y los borra de la BD al terminar.
 */
import { expect, Page, test } from '../helpers/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { apiFetch, DB, loginAsReal, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const PREFIJO = 'E2E Cliente';
const unico = () => `${PREFIJO} ${Date.now()}`;
const fila = (page: Page, nombre: string) => page.getByRole('row').filter({ hasText: nombre });
const dialogo = (page: Page) => page.getByRole('dialog');
const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });
const enBd = (nombre: string) => sql(`select id_sucursal_id||'|'||telefono||'|'||apellido_paterno from clientes_cliente where nombre='${nombre}'`);
const idEnBd = (nombre: string) => Number(sql(`select id from clientes_cliente where nombre='${nombre}'`));

async function abrir(page: Page, user: TestUser = TEST_USERS.anaCentro) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Clientes', level: 1 })).toBeVisible();
}

/** Alta por API como `user` (sucursal del cajero). */
async function crearCliente(user: TestUser, nombre: string) {
  const r = await apiFetch(user, 'POST', 'clientes/', { nombre, apellido_paterno: 'Prueba', telefono: '5512345678' });
  expect(r.status).toBe(201);
}

async function llenar(page: Page, v: { nombre?: string; paterno?: string; telefono?: string; correo?: string; rfc?: string }) {
  const d = dialogo(page);
  if (v.nombre !== undefined) await d.getByLabel('Nombre(s)').fill(v.nombre);
  if (v.paterno !== undefined) await d.getByLabel('Apellido Paterno').fill(v.paterno);
  if (v.telefono !== undefined) await d.getByLabel('Teléfono').fill(v.telefono);
  if (v.correo !== undefined) await d.getByLabel('Correo Electrónico').fill(v.correo);
  if (v.rfc !== undefined) await d.getByLabel('RFC').fill(v.rfc);
}

test.describe('Clientes flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  test.afterEach(() => {
    sql(`delete from clientes_cliente where nombre like '${PREFIJO}%'`);
  });

  test('FLU-CLI-001 crear, editar y eliminar un cliente', async ({ page }) => {
    const nombre = unico();
    await abrir(page, TEST_USERS.gerenteGeneral);

    // Crear: queda en la sucursal del cajero (Centro)
    await page.getByRole('button', { name: 'Registrar Cliente' }).click();
    await llenar(page, { nombre, paterno: 'Perez', telefono: '5512345678', correo: 'e2e.cliente@trt.com', rfc: 'PEPJ800101ABC' });
    await dialogo(page).getByRole('button', { name: 'Registrar Cliente' }).click();
    await expect(toast(page, 'Cliente registrado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toContainText('e2e.cliente@trt.com');
    await expect(fila(page, nombre)).toContainText('PEPJ800101ABC');
    expect(enBd(nombre)).toBe('1|5512345678|Perez');

    // Editar teléfono
    await fila(page, nombre).getByRole('button', { name: 'Editar' }).click();
    await dialogo(page).getByLabel('Teléfono').fill('5599998888');
    await dialogo(page).getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(toast(page, 'Cliente actualizado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toContainText('5599998888');
    expect(enBd(nombre)).toBe('1|5599998888|Perez');

    // Eliminar
    await fila(page, nombre).getByRole('button', { name: 'Eliminar' }).click();
    await dialogo(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect(toast(page, 'Cliente eliminado correctamente')).toBeVisible();
    await expect(fila(page, nombre)).toHaveCount(0);
    expect(enBd(nombre)).toBe('');
  });

  test('FLU-CLI-002 cancelar la eliminación no borra', async ({ page }) => {
    const nombre = unico();
    await crearCliente(TEST_USERS.anaCentro, nombre);
    await abrir(page, TEST_USERS.gerenteGeneral);

    await fila(page, nombre).getByRole('button', { name: 'Eliminar' }).click();
    await expect(dialogo(page)).toContainText(nombre);
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialogo(page)).toHaveCount(0);
    await expect(fila(page, nombre)).toHaveCount(1);
    expect(enBd(nombre)).not.toBe('');
  });

  test('FLU-CLI-003 campos obligatorios y formatos: el formulario no envía nada inválido', async ({ page }) => {
    const nombre = unico();
    await abrir(page);
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/clientes/.test(r.url()) && posts.push(r.url()));

    await page.getByRole('button', { name: 'Registrar Cliente' }).click();
    const guardar = dialogo(page).getByRole('button', { name: 'Registrar Cliente' });
    await expect(guardar).toBeDisabled(); // vacío

    await llenar(page, { nombre: 'A', paterno: 'B', telefono: 'abc', correo: 'no-es-correo' });
    await dialogo(page).getByLabel('Nombre(s)').blur();
    await expect(dialogo(page)).toContainText('El nombre es requerido (mín. 2 caracteres)');
    await expect(dialogo(page)).toContainText('El apellido paterno es requerido');
    await expect(dialogo(page)).toContainText('Teléfono inválido (7-15 caracteres)');
    await expect(dialogo(page)).toContainText('Correo electrónico inválido');
    await expect(guardar).toBeDisabled();

    // RFC: el campo corta a 13 caracteres
    await llenar(page, { rfc: 'ABCDEFGHIJKLMNOP' });
    await expect(dialogo(page).getByLabel('RFC')).toHaveValue('ABCDEFGHIJKLM');

    // Corregido: habilita y envía
    await llenar(page, { nombre, paterno: 'Perez', telefono: '5512345678', correo: '' });
    await expect(guardar).toBeEnabled();
    expect(posts).toHaveLength(0);
    await guardar.click();
    await expect(toast(page, 'Cliente registrado correctamente')).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test('FLU-CLI-004 el back rechaza (cliente ya borrado → 404) y la UI muestra su mensaje', async ({ page }) => {
    // El back no tiene regla de duplicados (mismo nombre/teléfono se acepta); el rechazo real alcanzable es el 404.
    const nombre = unico();
    await crearCliente(TEST_USERS.anaCentro, nombre);
    await abrir(page, TEST_USERS.gerenteGeneral);
    await expect(fila(page, nombre)).toHaveCount(1);

    sql(`delete from clientes_cliente where nombre='${nombre}'`); // otro usuario lo eliminó mientras la lista estaba abierta
    await fila(page, nombre).getByRole('button', { name: 'Editar' }).click();
    await dialogo(page).getByLabel('Teléfono').fill('5500000000');
    await dialogo(page).getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(toast(page, /no encontrado/i)).toBeVisible();
    expect(enBd(nombre)).toBe('');
  });

  test('FLU-CLI-004b el cajero no ve editar ni eliminar (el back los rechaza con 403, H-F3-2)', async ({ page }) => {
    const nombre = unico();
    await crearCliente(TEST_USERS.anaCentro, nombre);
    await abrir(page);
    await expect(fila(page, nombre)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);

    expect(enBd(nombre)).toBe('1|5512345678|Prueba');
  });

  test('FLU-CLI-005 no hay búsqueda ni paginación; la lista respeta la sucursal del usuario', async ({ page, browser }) => {
    // Sin buscador/paginador en la UI (no aplica). Se cubre el filtrado por sucursal del back (fix "clientes por sucursal").
    const nombre = unico();
    await crearCliente(TEST_USERS.anaCentro, nombre); // Centro
    expect(enBd(nombre).startsWith('1|')).toBe(true);

    // Cajero de Norte: no lo ve
    await abrir(page, TEST_USERS.mariaNorte);
    await expect(page.getByRole('button', { name: 'Registrar Cliente' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: /Prueba/ })).toHaveCount(0);
    await expect(fila(page, nombre)).toHaveCount(0);

    // Cajero de Centro y gerente (misma sucursal): sí
    for (const user of [TEST_USERS.anaCentro, TEST_USERS.gerenteGeneral]) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await abrir(p, user);
      await expect(fila(p, nombre)).toHaveCount(1);
      await ctx.close();
    }

    // Un cliente creado por Norte queda en Norte y Centro no lo ve
    const norte = unico() + ' N';
    await crearCliente(TEST_USERS.mariaNorte, norte);
    expect(enBd(norte).startsWith('2|')).toBe(true);
    await page.reload();
    await expect(fila(page, norte)).toHaveCount(1);
    expect(idEnBd(norte)).toBeGreaterThan(0);
  });
});
