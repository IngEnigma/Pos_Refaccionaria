/**
 * FLU-SUC — Sucursales contra backend REAL local (plan-pruebas-flujos-e2e.md §3.9).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Misma pantalla y selectores que `e2e/admin.branches.spec.ts` (mocks), pero contra el back: `/branches`, solo admin.
 * Permisos del back (`repository/permissions.py`): listar = catalogos.leer (todos); crear/editar/eliminar = sucursales.admin (solo admin).
 * Las sucursales de cada prueba se llaman `E2E SUC <timestamp>` y se borran de la BD al terminar (las del seed no se tocan).
 *
 * Hallazgos de back (solo reportados, la prueba queda en `test.fixme`):
 *   H-F6-9   POST /api/sucursales/ acepta un nombre repetido (201): `nombre_sucursal` no es único
 *   H-F6-10  POST /api/sucursales/ acepta nombre vacío o ausente y un correo inválido: solo exige `ubicacion`
 */
import { expect, Page, test } from '@playwright/test';

import { TEST_USERS } from '../fixtures/test-users';
import { apiFetch, DB, loginAsReal, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const ADMIN = TEST_USERS.adminE2e;
const PREFIJO = 'E2E SUC';
const CAMPOS = ['id', 'nombre_sucursal', 'codigo_sucursal', 'ubicacion', 'codigo_postal', 'numero_telefono', 'correo_electronico'];

const toast = (page: Page, texto: string | RegExp) => page.locator('.toast-message').filter({ hasText: texto });
const card = (page: Page, nombre: string) =>
  page.locator('app-branch-card').filter({ has: page.getByRole('heading', { name: nombre, level: 3, exact: true }) });
const enBd = (nombre: string) =>
  sql(`select nombre_sucursal||'|'||ubicacion||'|'||codigo_postal||'|'||numero_telefono||'|'||correo_electronico from sucursales_sucursal where nombre_sucursal='${nombre}'`);
const cuenta = (nombre: string) => Number(sql(`select count(*) from sucursales_sucursal where nombre_sucursal='${nombre}'`));

async function llenar(page: Page, v: { nombre: string; ubicacion: string; cp: string; tel: string; correo: string }) {
  const d = page.getByRole('dialog');
  await d.getByLabel('Nombre de la Sucursal').fill(v.nombre);
  await d.getByLabel('Ubicación').fill(v.ubicacion);
  await d.getByLabel('Código Postal').fill(v.cp);
  await d.getByLabel('Teléfono').fill(v.tel);
  await d.getByLabel('Correo Electrónico').fill(v.correo);
}

async function abrir(page: Page) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, ADMIN);
  await page.goto('/branches');
  await expect(page.getByRole('heading', { name: 'Sucursales', level: 1 })).toBeVisible();
  await expect(card(page, 'Centro')).toBeVisible({ timeout: 30_000 });
}

test.describe('Sucursales flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  const sufijo = `${Date.now()}`;
  let n = 0;
  const nombre = () => `${PREFIJO} ${sufijo}-${++n}`;
  // También borra lo que deja un back sin validar (H-F6-9 / H-F6-10): copia de "Centro" y sucursales sin nombre.
  const limpiar = () =>
    sql(`delete from sucursales_sucursal where nombre_sucursal like '${PREFIJO} %' or ubicacion like '${PREFIJO} %' or (id>3 and nombre_sucursal='Centro')`);
  const datos = (nom: string) => ({ nombre_sucursal: nom, ubicacion: 'Calle E2E 1, Col. Test', codigo_postal: '06000', numero_telefono: '5512345678', correo_electronico: 'e2e.suc@trt.com' });

  test.beforeEach(limpiar);
  test.afterEach(limpiar);

  test('FLU-SUC-001 admin crea, edita y elimina una sucursal; la lista y la BD reflejan cada cambio', async ({ page }) => {
    const nom = nombre();
    await abrir(page);

    // Crear
    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    await llenar(page, { nombre: nom, ubicacion: 'Calle E2E 1, Col. Test', cp: '06000', tel: '5512345678', correo: 'e2e.suc@trt.com' });
    await page.getByRole('dialog').getByRole('button', { name: 'Registrar Sucursal' }).click();
    await expect(toast(page, 'Sucursal registrada correctamente')).toBeVisible();
    await expect(card(page, nom)).toContainText('Calle E2E 1, Col. Test');
    expect(enBd(nom)).toBe(`${nom}|Calle E2E 1, Col. Test|06000|5512345678|e2e.suc@trt.com`);
    expect(sql(`select codigo_sucursal from sucursales_sucursal where nombre_sucursal='${nom}'`)).toMatch(/^SUC-[0-9A-F]{6}$/);
    await expect(card(page, nom)).toContainText(/SUC-[0-9A-F]{6}/);

    // Editar
    await card(page, nom).getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Sucursal' })).toBeVisible();
    await page.getByRole('dialog').getByLabel('Nombre de la Sucursal').fill(`${nom} ed`);
    await page.getByRole('dialog').getByLabel('Ubicación').fill('Otra calle 99');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(toast(page, 'Sucursal actualizada correctamente')).toBeVisible();
    await expect(card(page, `${nom} ed`)).toContainText('Otra calle 99');
    await expect(card(page, nom)).toHaveCount(0);
    expect(enBd(`${nom} ed`)).toBe(`${nom} ed|Otra calle 99|06000|5512345678|e2e.suc@trt.com`);
    expect(cuenta(nom)).toBe(0);

    // Eliminar (con confirmación)
    await card(page, `${nom} ed`).getByRole('button', { name: 'Eliminar' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Eliminar Sucursal' })).toBeVisible();
    await expect(confirm).toContainText(`"${nom} ed"`);
    await confirm.getByRole('button', { name: 'Eliminar' }).click();
    await expect(toast(page, 'Sucursal eliminada correctamente')).toBeVisible();
    await expect(card(page, `${nom} ed`)).toHaveCount(0);
    expect(cuenta(`${nom} ed`)).toBe(0);
    await expect(card(page, 'Centro')).toBeVisible();
  });

  test('FLU-SUC-001b la respuesta del back trae todos los campos que muestra la UI (alta, lista y edición)', async ({ page }) => {
    const nom = nombre();
    const alta = await apiFetch(ADMIN, 'POST', 'sucursales/', datos(nom));
    expect(alta.status, JSON.stringify(alta.body)).toBe(201);
    expect(Object.keys(alta.body).sort()).toEqual([...CAMPOS].sort());
    expect(alta.body).toMatchObject(datos(nom));
    expect(alta.body.codigo_sucursal).toMatch(/^SUC-[0-9A-F]{6}$/);

    const lista = (await apiFetch(TEST_USERS.anaCentro, 'GET', 'sucursales/')).body as Record<string, unknown>[];
    const suya = lista.find((s) => s['id'] === alta.body.id)!;
    expect(Object.keys(suya).sort()).toEqual([...CAMPOS].sort());
    for (const s of lista) expect(Object.keys(s).sort(), `sucursal ${s['id']}`).toEqual([...CAMPOS].sort());

    const put = await apiFetch(ADMIN, 'PUT', `sucursales/${alta.body.id}/`, { ...datos(nom), numero_telefono: '5598765432' });
    expect(put.status).toBe(200);
    expect(Object.keys(put.body).sort()).toEqual([...CAMPOS].sort());
    expect(put.body.numero_telefono).toBe('5598765432');

    // La UI pinta los cinco datos de la tarjeta y el formulario de edición los precarga
    await abrir(page);
    const c = card(page, nom);
    await expect(c).toContainText(alta.body.codigo_sucursal);
    await expect(c).toContainText('Calle E2E 1, Col. Test');
    await expect(c).toContainText('5598765432');
    await expect(c).toContainText('e2e.suc@trt.com');
    await c.getByRole('button', { name: 'Editar' }).click();
    const d = page.getByRole('dialog');
    await expect(d.getByLabel('Nombre de la Sucursal')).toHaveValue(nom);
    await expect(d.getByLabel('Ubicación')).toHaveValue('Calle E2E 1, Col. Test');
    await expect(d.getByLabel('Código Postal')).toHaveValue('06000');
    await expect(d.getByLabel('Teléfono')).toHaveValue('5598765432');
    await expect(d.getByLabel('Correo Electrónico')).toHaveValue('e2e.suc@trt.com');
    await expect(d.getByLabel('Código de Sucursal')).toHaveValue(alta.body.codigo_sucursal);
  });

  test('FLU-SUC-002 cancelar la eliminación no borra la sucursal ni llama al back', async ({ page }) => {
    const nom = nombre();
    expect((await apiFetch(ADMIN, 'POST', 'sucursales/', datos(nom))).status).toBe(201);
    const deletes: string[] = [];
    page.on('request', (r) => r.method() === 'DELETE' && deletes.push(r.url()));
    await abrir(page);

    await card(page, nom).getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(deletes).toEqual([]);
    expect(cuenta(nom)).toBe(1);
    await expect(card(page, nom)).toBeVisible();
  });

  test('FLU-SUC-003 nombre corto o campos vacíos no se envían; el back exige al menos la ubicación', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/api\/sucursales/.test(r.url()) && posts.push(r.url()));
    await abrir(page);

    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    const d = page.getByRole('dialog');
    const enviar = d.getByRole('button', { name: 'Registrar Sucursal' });
    await expect(enviar).toBeDisabled();

    await d.getByLabel('Nombre de la Sucursal').fill('Su');
    await d.getByLabel('Nombre de la Sucursal').blur();
    await expect(d.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeVisible();
    await d.getByLabel('Nombre de la Sucursal').fill('   ');
    await d.getByLabel('Nombre de la Sucursal').blur();
    await expect(d.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeVisible();
    await d.getByLabel('Teléfono').fill('abc');
    await d.getByLabel('Teléfono').blur();
    await expect(d.getByText('Teléfono inválido (solo números, máx. 15)')).toBeVisible();
    await d.getByLabel('Correo Electrónico').fill('no-es-correo');
    await d.getByLabel('Correo Electrónico').blur();
    await expect(d.getByText('Ingrese un correo electrónico válido')).toBeVisible();
    await d.getByLabel('Código Postal').fill('12345678901'); // 11 > 10 (tope del modelo)
    await d.getByLabel('Código Postal').blur();
    await expect(enviar).toBeDisabled();

    // Todo válido → se habilita (no se envía)
    await llenar(page, { nombre: nombre(), ubicacion: 'Calle 1', cp: '06000', tel: '5512345678', correo: 'ok@trt.com' });
    await expect(enviar).toBeEnabled();
    await d.getByRole('button', { name: 'Cancelar' }).click();
    expect(posts).toEqual([]);

    // Lo que el formulario evita, el back también lo rechaza cuando falta lo indispensable
    const sinUbicacion = await apiFetch(ADMIN, 'POST', 'sucursales/', { nombre_sucursal: nombre() });
    expect(sinUbicacion.status).toBe(400);
    expect(sinUbicacion.body.error).toContain('ubicacion');
    expect(sql(`select count(*) from sucursales_sucursal where nombre_sucursal like '${PREFIJO} %'`)).toBe('0');
  });

  test.fixme('FLU-SUC-003b el back rechaza nombre vacío o ausente y correo inválido — H-F6-10', async () => {
    // H-F6-10 (BACK): `nombre_sucursal` y los demás son blank=True: POST con solo `ubicacion` → 201; correo "no-es-correo" → 201.
    const vacio = await apiFetch(ADMIN, 'POST', 'sucursales/', { ubicacion: `${PREFIJO} sin nombre`, nombre_sucursal: '' });
    expect(vacio.status).toBe(400);
    const correo = await apiFetch(ADMIN, 'POST', 'sucursales/', { ...datos(nombre()), correo_electronico: 'no-es-correo' });
    expect(correo.status).toBe(400);
  });

  test.fixme('FLU-SUC-004 un nombre de sucursal duplicado se rechaza y la UI muestra el mensaje del back — H-F6-9', async ({ page }) => {
    // H-F6-9 (BACK): `Sucursal.nombre_sucursal` no es único → POST con un nombre existente responde 201 y crea la segunda sucursal.
    // El único campo único es `codigo_sucursal`, autogenerado: la UI no tiene cómo provocar un rechazo real del back.
    await abrir(page);
    await page.getByRole('button', { name: 'Registrar Sucursal' }).click();
    await llenar(page, { nombre: 'Centro', ubicacion: 'Otra 1', cp: '06000', tel: '5512345678', correo: 'c2@trt.com' });
    await page.getByRole('dialog').getByRole('button', { name: 'Registrar Sucursal' }).click();

    await expect(toast(page, /.+/)).toContainText(/nombre|existe|duplicad/i);
    expect(cuenta('Centro')).toBe(1);
  });

  test('FLU-SUC-005 manager y cajero no entran a /branches y el back les niega crear, editar y eliminar', async ({ page, browser }) => {
    const nom = nombre();
    const alta = await apiFetch(ADMIN, 'POST', 'sucursales/', datos(nom));
    expect(alta.status).toBe(201);
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');

    for (const user of [TEST_USERS.gerenteGeneral, TEST_USERS.anaCentro]) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await loginAsReal(p, user);
      await p.goto('/branches');
      await expect(p).toHaveURL(/\/sales$/);
      await expect(p.getByRole('link', { name: 'Sucursales', exact: true })).toHaveCount(0);
      await ctx.close();

      // Aunque llamen a la API directo: lectura sí (catalogos.leer), escritura no (sucursales.admin)
      expect((await apiFetch(user, 'GET', 'sucursales/')).status).toBe(200);
      expect((await apiFetch(user, 'POST', 'sucursales/', datos(nombre()))).status).toBe(403);
      expect((await apiFetch(user, 'PUT', `sucursales/${alta.body.id}/`, { ...datos(nom), ubicacion: 'hackeada' })).status).toBe(403);
      expect((await apiFetch(user, 'DELETE', `sucursales/${alta.body.id}/`)).status).toBe(403);
    }
    expect(enBd(nom)).toBe(`${nom}|Calle E2E 1, Col. Test|06000|5512345678|e2e.suc@trt.com`);
    expect(sql(`select count(*) from sucursales_sucursal where nombre_sucursal like '${PREFIJO} %'`)).toBe('1');
  });
});
