/**
 * FLU-INV — Inventario (productos y tipos de producto) contra backend REAL local (plan-pruebas-flujos-e2e.md §3.4).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Qué hay en pantalla (`/inventory`): la lista sale de `GET /inventarios/mi-sucursal/` (solo productos CON fila de stock en
 * la sucursal del usuario) y ofrece Añadir / Editar / Precio / Eliminar. NO hay pantalla de tipos de producto (el slider de
 * categorías solo lista): FLU-INV-003 se cubre por API.
 * Permisos del back (`repository/permissions.py`): crear producto/tipo = catalogos.crear (cajero, encargado, admin);
 * editar/eliminar = catalogos.escribir (encargado, admin).
 *
 * Hallazgos (la causa vive en src/app/features/inventory, que NO se toca aquí): las pruebas con `test.fixme` dicen el ID.
 *   H-F6-1  FRONT  crear producto por UI siempre da 400 (sin proveedor; descripción/SAT vacíos viajan como null)
 *   H-F6-2  FRONT  editar/eliminar usan el id de la fila de stock (`InventoryItem.id`), no el del producto
 *   H-F6-3  FRONT  el diálogo de edición pierde categoría, proveedor, descripción y SAT (la lista no los trae)
 *   H-F6-4  FRONT  el cajero ve Editar / Precio / Eliminar y el back responde 403
 *   H-F6-5  FRONT  el filtro por categoría no filtra
 *   H-F6-6  BACK   tipos: acepta nombre vacío y duplicado
 *   H-F6-7  BACK   productos: acepta precio negativo, nombre vacío y id_tipo inexistente (queda null)
 *   H-F6-8  BACK   productos: acepta código de barras duplicado
 *   H-F6-11 FRONT  el diálogo de producto no hace scroll: en pantallas de ≤ ~800 px de alto Crear / Cancelar quedan fuera de vista
 *   H-F6-12 FRONT  los errores del back nunca se muestran (NG0600: effects de error sin allowSignalWrites) y, de mostrarse, dirían "Http failure response…"
 * Las pruebas que usan el diálogo agrandan el viewport a 1280x1000 para esquivar H-F6-11.
 * Cada prueba crea sus productos por API con clave `E2E-INV-<timestamp>-n`, los limpia de la BD al terminar y no toca los del seed.
 */
import { expect, Locator, Page, test } from '@playwright/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { apiFetch, DB, loginAsReal, sql } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const CENTRO = 1;
const NORTE = 2;
const ADMIN = TEST_USERS.adminE2e;
const GERENTE = TEST_USERS.gerenteGeneral;
const CAJERO = TEST_USERS.anaCentro;

const toast = (page: Page) => page.locator('.toast-message').first();
const dialogo = (page: Page) => page.getByRole('dialog');
const tarjeta = (page: Page, nombre: string): Locator =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre }) });
const busqueda = (page: Page) => page.getByRole('textbox', { name: /buscar/i }).first();

test.describe('Inventario flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  const sufijo = `${Date.now()}`;
  let n = 0;
  let proveedorId: number;
  let productos: number[] = [];
  let tipos: number[] = [];

  const unico = () => `${sufijo}-${++n}`;

  /** Alta por API como admin. Devuelve id y datos enviados. */
  async function crearProductoApi(extra: Record<string, unknown> = {}) {
    const u = unico();
    const datos = {
      clave: `E2E-INV-${u}`,
      nombre: `Prod INV ${u}`,
      descripcion: 'creado por E2E',
      codigo_barras: `750INV${u.replace('-', '')}`,
      precio_venta: 50,
      marca: 'E2E',
      costo: 20,
      id_tipo: 1,
      id_proveedor: proveedorId,
      codigoSAT: '',
      ...extra,
    };
    const r = await apiFetch(ADMIN, 'POST', 'productos/', datos);
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    productos.push(r.body.id);
    return { id: r.body.id as number, ...datos };
  }

  /** Entrada de inventario por API (como gerente de Centro): crea la fila de stock del producto en la sucursal. */
  async function darStock(idProducto: number, cantidad = 50, sucursal = CENTRO) {
    const r = await apiFetch(ADMIN, 'POST', 'movimientos-inventario/', {
      id_producto: idProducto,
      id_sucursal: sucursal,
      cantidad,
      tipo_movimiento: 'ENTRADA',
      razon: 'E2E inv',
    });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
  }

  /** Id de la fila de stock (lo que la lista de /inventory llama `id`) de un producto en una sucursal. */
  const filaStock = (idProducto: number, sucursal = CENTRO) =>
    Number(sql(`select id from inventario_stock where id_producto_id=${idProducto} and id_sucursal_id=${sucursal}`));

  async function abrirInventario(page: Page, user: TestUser = ADMIN) {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, user);
    await page.setViewportSize({ width: 1280, height: 1000 }); // H-F6-11
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: /Productos — Mi Sucursal/ })).toBeVisible({ timeout: 30_000 });
  }

  /** Filtra la lista con el buscador de la barra superior. */
  async function buscar(page: Page, texto: string) {
    await busqueda(page).fill(texto);
  }

  async function llenarProducto(page: Page, v: { nombre: string; clave: string; barras: string; marca: string; costo: string; precio: string; categoria?: string }) {
    const d = dialogo(page);
    await d.getByLabel('Nombre del Producto').fill(v.nombre);
    await d.getByLabel('Clave / SKU').fill(v.clave);
    await d.getByLabel('Código de Barras').fill(v.barras);
    if (v.categoria) await d.getByLabel('Categoría').selectOption({ label: v.categoria });
    await d.getByLabel('Marca').fill(v.marca);
    await d.getByLabel('Costo (Compra)').fill(v.costo);
    await d.getByLabel('Precio de Venta').fill(v.precio);
  }

  test.beforeAll(async () => {
    const r = await apiFetch(ADMIN, 'POST', 'proveedores/', {
      nombre: `E2E-PROV-INV-${sufijo}`,
      telefono: '5511112222',
      correo: `prov.inv.${sufijo}@trt.com`,
      direccion: 'Calle E2E 1',
    });
    expect(r.status, JSON.stringify(r.body)).toBe(201);
    proveedorId = r.body.id;
  });

  test.afterAll(() => {
    sql(`delete from producto_proveedor where id=${proveedorId}`);
  });

  test.beforeEach(() => {
    productos = [];
    tipos = [];
  });

  test.afterEach(() => {
    if (productos.length) {
      const ids = productos.join(',');
      sql(`delete from notifications_notification where ref_producto_id in (${ids})`);
      sql(`delete from inventario_movimientoinventario where id_producto_id in (${ids})`);
      sql(`delete from inventario_stock where id_producto_id in (${ids})`);
      sql(`delete from precio_sucursal where id_producto_id in (${ids})`);
      sql(`delete from producto_producto where id in (${ids})`);
    }
    if (tipos.length) sql(`delete from producto_tipo where id in (${tipos.join(',')})`);
    sql(`delete from producto_producto where clave like 'E2E-INV-${sufijo}%'`);
  });

  // ───────────────────────── FLU-INV-001: CRUD de producto ─────────────────────────

  test('FLU-INV-001 CRUD de producto por API (admin) y la lista de /inventory refleja alta, cambio y baja', async ({ page }) => {
    const p = await crearProductoApi();
    // Sin fila de stock en la sucursal el producto NO sale en la lista de /inventory (mi-sucursal solo trae stock)
    await abrirInventario(page);
    await buscar(page, p.nombre);
    await expect(tarjeta(page, p.nombre)).toHaveCount(0);

    await darStock(p.id, 30);
    await page.reload();
    await buscar(page, p.nombre);
    const card = tarjeta(page, p.nombre);
    await expect(card).toBeVisible();
    await expect(card).toContainText(p.clave);
    await expect(card).toContainText('30 en stock');
    await expect(card).toContainText('50.00');

    // Editar por API → la lista lo muestra
    const put = await apiFetch(ADMIN, 'PUT', `productos/${p.id}/`, { ...p, nombre: `${p.nombre} editado`, precio_venta: 65 });
    expect(put.status, JSON.stringify(put.body)).toBe(200);
    expect(sql(`select nombre||'|'||precio_venta from producto_producto where id=${p.id}`)).toBe(`${p.nombre} editado|65`);
    await page.reload();
    await buscar(page, `${p.nombre} editado`);
    await expect(tarjeta(page, `${p.nombre} editado`)).toContainText('65.00');

    // Eliminar por API → desaparece de la lista y de la BD
    const del = await apiFetch(ADMIN, 'DELETE', `productos/${p.id}/`);
    expect(del.status).toBe(200);
    expect(sql(`select count(*) from producto_producto where id=${p.id}`)).toBe('0');
    await page.reload();
    await buscar(page, p.nombre);
    await expect(tarjeta(page, p.nombre)).toHaveCount(0);
  });

  test.fixme('FLU-INV-004c los botones Crear y Cancelar del diálogo son alcanzables en una pantalla de 1366x768 — H-F6-11', async ({ page }) => {
    // H-F6-11 (FRONT): product-form-dialog.component.css quitó max-height/overflow-y (comentarios "Eliminamos el overflow-y"): el diálogo mide
    // más que la ventana, no hace scroll y el footer queda fuera del viewport (Playwright: "element is outside of the viewport").
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, ADMIN);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/inventory');
    await page.getByRole('button', { name: 'Añadir Producto' }).click();

    await expect(dialogo(page).getByRole('button', { name: 'Cancelar' })).toBeInViewport();
    await expect(dialogo(page).getByRole('button', { name: 'Crear Producto' })).toBeInViewport();
  });

  test.fixme('FLU-INV-001b admin crea un producto por la UI y queda en BD — H-F6-1', async ({ page }) => {
    // H-F6-1 (FRONT): el formulario no tiene proveedor y el back exige id_proveedor → 400 "Faltan campos obligatorios: id_proveedor".
    // Aun con proveedor, descripción y código SAT vacíos viajan como null y el back responde 400 NOT NULL (descripcion/codigoSAT).
    const u = unico();
    const v = { nombre: `Prod INV UI ${u}`, clave: `E2E-INV-${sufijo}-ui${n}`, barras: `750UI${n}`, marca: 'E2E', costo: '20', precio: '50', categoria: 'Frenos' };
    await abrirInventario(page);

    await page.getByRole('button', { name: 'Añadir Producto' }).click();
    await llenarProducto(page, v);
    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/productos\/?$/.test(r.url()));
    await dialogo(page).getByRole('button', { name: 'Crear Producto' }).click();
    expect((await posted).status()).toBe(201);

    await expect(toast(page)).toContainText('Producto creado correctamente');
    expect(sql(`select count(*) from producto_producto where clave='${v.clave}'`)).toBe('1');
  });

  test.fixme('FLU-INV-001c admin edita un producto desde la lista: el PUT va al id del producto — H-F6-2 / H-F6-3', async ({ page }) => {
    // H-F6-2 (FRONT): `onModifyProduct` usa `product.id` = id de la fila de stock (inventory.page.ts), no `idProducto`.
    // H-F6-3 (FRONT): el diálogo abre sin categoría, proveedor, descripción ni SAT (la lista no los trae) y el PUT los pisa.
    const p = await crearProductoApi();
    await darStock(p.id, 30);
    const filaId = filaStock(p.id);
    test.skip(sql(`select count(*) from producto_producto where id=${filaId}`) !== '0', 'colisión: el id de la fila de stock es de otro producto');
    await abrirInventario(page);
    await buscar(page, p.nombre);

    await tarjeta(page, p.nombre).getByRole('button', { name: 'Modificar producto' }).click();
    const categoria = dialogo(page).getByLabel('Categoría');
    const llegaVacia = (await categoria.inputValue()) !== '1'; // H-F6-3: llega vacía; hay que elegirla a mano para poder guardar
    if (llegaVacia) await categoria.selectOption({ label: 'Frenos' });
    await dialogo(page).getByLabel('Nombre del Producto').fill(`${p.nombre} editado`);
    const put = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/api\/productos\//.test(r.url()));
    await dialogo(page).getByRole('button', { name: 'Guardar Cambios' }).click();
    const res = await put;
    expect(res.url()).toMatch(new RegExp(`/productos/${p.id}/?$`)); // H-F6-2: va a /productos/${filaId}
    expect(res.status()).toBe(200);
    expect(llegaVacia).toBe(false);

    expect(sql(`select nombre||'|'||id_proveedor_id||'|'||descripcion from producto_producto where id=${p.id}`)).toBe(`${p.nombre} editado|${proveedorId}|creado por E2E`);
  });

  test.fixme('FLU-INV-001d admin elimina un producto desde la lista: el DELETE va al id del producto — H-F6-2', async ({ page }) => {
    // H-F6-2 (FRONT): `onDeleteProduct` manda DELETE /productos/<id de la fila de stock>: en un seed con ids cruzados borra OTRO producto.
    const p = await crearProductoApi();
    await darStock(p.id, 30);
    const filaId = filaStock(p.id);
    test.skip(sql(`select count(*) from producto_producto where id=${filaId}`) !== '0', 'colisión: el id de la fila de stock es de otro producto');
    await abrirInventario(page);
    await buscar(page, p.nombre);

    await tarjeta(page, p.nombre).getByRole('button', { name: 'Eliminar producto' }).click();
    await expect(dialogo(page)).toContainText(`"${p.nombre}"`);
    const del = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/api\/productos\//.test(r.url()));
    await dialogo(page).getByRole('button', { name: 'Eliminar' }).click();
    const res = await del;
    expect(res.url()).toMatch(new RegExp(`/productos/${p.id}/?$`));
    expect(res.status()).toBe(200);

    await expect(toast(page)).toContainText('Producto eliminado correctamente');
    expect(sql(`select count(*) from producto_producto where id=${p.id}`)).toBe('0');
    await expect(tarjeta(page, p.nombre)).toHaveCount(0);
  });

  test('FLU-INV-001e cancelar la eliminación de un producto no lo borra ni llama al back', async ({ page }) => {
    const p = await crearProductoApi();
    await darStock(p.id, 30);
    const deletes: string[] = [];
    page.on('request', (r) => r.method() === 'DELETE' && deletes.push(r.url()));
    await abrirInventario(page);
    await buscar(page, p.nombre);

    await tarjeta(page, p.nombre).getByRole('button', { name: 'Eliminar producto' }).click();
    await dialogo(page).getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialogo(page)).toHaveCount(0);
    expect(deletes).toEqual([]);
    expect(sql(`select count(*) from producto_producto where id=${p.id}`)).toBe('1');
    await expect(tarjeta(page, p.nombre)).toBeVisible();
  });

  test('FLU-INV-001f permisos del back sobre productos: cajero crea pero no edita ni elimina; encargado y admin sí', async () => {
    const { id, ...datos } = await crearProductoApi();
    const p = { id, ...datos };
    const cuerpo = { ...datos, nombre: `${p.nombre} rol` };

    // cajero: catalogos.crear sí, catalogos.escribir no
    const alta = await apiFetch(CAJERO, 'POST', 'productos/', { ...datos, clave: `${p.clave}-caj`, codigo_barras: `${p.codigo_barras}c` });
    expect(alta.status, JSON.stringify(alta.body)).toBe(201);
    productos.push(alta.body.id);
    expect((await apiFetch(CAJERO, 'PUT', `productos/${p.id}/`, cuerpo)).status).toBe(403);
    expect((await apiFetch(CAJERO, 'DELETE', `productos/${p.id}/`)).status).toBe(403);
    expect(sql(`select nombre from producto_producto where id=${p.id}`)).toBe(p.nombre);

    // encargado y admin: editan y eliminan
    expect((await apiFetch(GERENTE, 'PUT', `productos/${p.id}/`, cuerpo)).status).toBe(200);
    expect((await apiFetch(ADMIN, 'PUT', `productos/${p.id}/`, { ...datos, nombre: p.nombre })).status).toBe(200);
    expect((await apiFetch(GERENTE, 'DELETE', `productos/${alta.body.id}/`)).status).toBe(200);
    expect((await apiFetch(ADMIN, 'DELETE', `productos/${p.id}/`)).status).toBe(200);
    expect(sql(`select count(*) from producto_producto where id in (${p.id},${alta.body.id})`)).toBe('0');
  });

  test.fixme('FLU-INV-001g el cajero no ve Editar, Precio ni Eliminar (el back le responde 403) — H-F6-4', async ({ page }) => {
    // H-F6-4 (FRONT): la tarjeta muestra las 3 acciones a todos los roles; PUT/DELETE/POST precios-sucursal son 403 para el cajero y
    // el interceptor lo manda a /login (verificado: cajero pulsa "Precio" → POST /precios-sucursal/ 403 → termina en /login).
    const p = await crearProductoApi();
    await darStock(p.id, 30);
    await abrirInventario(page, CAJERO);
    await buscar(page, p.nombre);

    const card = tarjeta(page, p.nombre);
    await expect(card).toBeVisible();
    await expect(card.getByRole('button', { name: 'Modificar producto' })).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Cambiar precio sucursal' })).toHaveCount(0);
    await expect(card.getByRole('button', { name: 'Eliminar producto' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Añadir Producto' })).toBeVisible(); // crear sí está permitido (catalogos.crear)
  });

  // ───────────────────────── FLU-INV-002: búsqueda y filtros ─────────────────────────

  test('FLU-INV-002 el buscador filtra por nombre, por clave y por código de barras', async ({ page }) => {
    const a = await crearProductoApi({ nombre: `Alfa INV ${unico()}` });
    const b = await crearProductoApi({ nombre: `Beta INV ${unico()}` });
    await darStock(a.id);
    await darStock(b.id);
    await abrirInventario(page);

    await buscar(page, a.nombre);
    await expect(tarjeta(page, a.nombre)).toBeVisible();
    await expect(tarjeta(page, b.nombre)).toHaveCount(0);

    await buscar(page, b.clave);
    await expect(tarjeta(page, b.nombre)).toBeVisible();
    await expect(tarjeta(page, a.nombre)).toHaveCount(0);

    await buscar(page, a.codigo_barras);
    await expect(tarjeta(page, a.nombre)).toBeVisible();
    await expect(tarjeta(page, b.nombre)).toHaveCount(0);

    await buscar(page, 'no-existe-xyz-123');
    await expect(page.getByRole('article')).toHaveCount(0);
    await buscar(page, '');
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('FLU-INV-002c la API filtra por categoría (tipo_id), por código de barras y por sucursal', async () => {
    const tipo = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre: `E2E INV tipo ${unico()}` });
    expect(tipo.status).toBe(201);
    tipos.push(tipo.body.id);
    const p = await crearProductoApi({ id_tipo: tipo.body.id });
    await darStock(p.id, 10, CENTRO);

    const porTipo = (await apiFetch(CAJERO, 'GET', `productos/?tipo_id=${tipo.body.id}`)).body as { id: number }[];
    expect(porTipo.map((x) => x.id)).toEqual([p.id]);

    const porBarras = await apiFetch(CAJERO, 'GET', `productos/codigo-barras/?codigo_barras=${p.codigo_barras}`);
    expect(porBarras.status).toBe(200);
    expect(porBarras.body.id).toBe(p.id);
    expect((await apiFetch(CAJERO, 'GET', 'productos/codigo-barras/?codigo_barras=no-existe-xyz')).status).toBe(404);

    // Con sucursal solo salen los que tienen stock ahí
    const centro = (await apiFetch(CAJERO, 'GET', `productos/?sucursal_id=${CENTRO}&search=${p.clave}`)).body as { id: number; cantidad: number }[];
    expect(centro.map((x) => [x.id, x.cantidad])).toEqual([[p.id, 10]]);
    expect(((await apiFetch(CAJERO, 'GET', `productos/?sucursal_id=${NORTE}&search=${p.clave}`)).body as unknown[])).toEqual([]);
  });

  test.fixme('FLU-INV-002b el filtro por categoría del slider deja solo los productos de esa categoría — H-F6-5', async ({ page }) => {
    // H-F6-5 (FRONT): `onSelectCategory` solo guarda el id y `filteredItems` hace `void catId` (inventory.page.ts): la lista no cambia.
    // Además `mi-sucursal` no trae id_tipo, así que el fix necesita ese dato (back) o cruzar con `GET /productos/?tipo_id=`.
    const tipo = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre: `E2E INV cat ${unico()}` });
    tipos.push(tipo.body.id);
    const enTipo = await crearProductoApi({ id_tipo: tipo.body.id });
    const otro = await crearProductoApi({ id_tipo: 1 });
    await darStock(enTipo.id);
    await darStock(otro.id);
    await abrirInventario(page);

    await page.getByRole('button', { name: new RegExp(`E2E INV cat`) }).click();
    await expect(tarjeta(page, enTipo.nombre)).toBeVisible();
    await expect(tarjeta(page, otro.nombre)).toHaveCount(0);
  });

  // ───────────────────────── FLU-INV-003: tipos de producto (sin UI) ─────────────────────────

  test('FLU-INV-003 tipos de producto por API (no hay pantalla): admin crea, edita y elimina; el producto queda sin tipo', async () => {
    const nombre = `E2E INV tipo ${unico()}`;
    const alta = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre });
    expect(alta.status, JSON.stringify(alta.body)).toBe(201);
    tipos.push(alta.body.id);
    expect(sql(`select nombre from producto_tipo where id=${alta.body.id}`)).toBe(nombre);
    expect(((await apiFetch(CAJERO, 'GET', 'tipos/')).body as { id: number }[]).map((t) => t.id)).toContain(alta.body.id);

    const put = await apiFetch(ADMIN, 'PUT', `tipos/${alta.body.id}/`, { nombre: `${nombre} editado` });
    expect(put.status).toBe(200);
    expect(sql(`select nombre from producto_tipo where id=${alta.body.id}`)).toBe(`${nombre} editado`);

    const p = await crearProductoApi({ id_tipo: alta.body.id });
    expect((await apiFetch(ADMIN, 'DELETE', `tipos/${alta.body.id}/`)).status).toBe(200);
    expect(sql(`select count(*) from producto_tipo where id=${alta.body.id}`)).toBe('0');
    expect(sql(`select ifnull(id_tipo_id,'null') from producto_producto where id=${p.id}`)).toBe('null'); // SET_NULL
  });

  test('FLU-INV-003b permisos del back sobre tipos: cajero crea pero no edita ni elimina; encargado edita y elimina', async () => {
    const alta = await apiFetch(CAJERO, 'POST', 'tipos/', { nombre: `E2E INV tipo caj ${unico()}` });
    expect(alta.status, JSON.stringify(alta.body)).toBe(201);
    tipos.push(alta.body.id);

    expect((await apiFetch(CAJERO, 'PUT', `tipos/${alta.body.id}/`, { nombre: 'x' })).status).toBe(403);
    expect((await apiFetch(CAJERO, 'DELETE', `tipos/${alta.body.id}/`)).status).toBe(403);
    expect((await apiFetch(GERENTE, 'PUT', `tipos/${alta.body.id}/`, { nombre: `E2E INV tipo ger ${unico()}` })).status).toBe(200);
    expect((await apiFetch(GERENTE, 'DELETE', `tipos/${alta.body.id}/`)).status).toBe(200);
  });

  test.fixme('FLU-INV-003c el back rechaza un tipo con nombre vacío o repetido — H-F6-6', async () => {
    // H-F6-6 (BACK): POST /api/tipos/ {"nombre": ""} → 201; el mismo nombre dos veces → 201 (ids distintos). `Tipo.nombre` no es único ni se valida.
    const nombre = `E2E INV dup ${unico()}`;
    const vacio = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre: '' });
    if (vacio.body?.id) tipos.push(vacio.body.id);
    expect(vacio.status).toBe(400);

    const a = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre });
    tipos.push(a.body.id);
    const b = await apiFetch(ADMIN, 'POST', 'tipos/', { nombre });
    if (b.body?.id) tipos.push(b.body.id);
    expect(b.status).toBe(400);
  });

  // ───────────────────────── FLU-INV-004: validaciones ─────────────────────────

  test('FLU-INV-004 el formulario de producto no se envía vacío ni con datos inválidos', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/api\/productos/.test(r.url()) && posts.push(r.url()));
    await abrirInventario(page);

    await page.getByRole('button', { name: 'Añadir Producto' }).click();
    const d = dialogo(page);
    const crear = d.getByRole('button', { name: 'Crear Producto' });
    await expect(d.getByRole('heading', { name: 'Nuevo Producto' })).toBeVisible();
    await expect(crear).toBeDisabled();

    await d.getByLabel('Nombre del Producto').fill('ab');
    await d.getByLabel('Nombre del Producto').blur();
    await expect(d.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeVisible();
    await d.getByLabel('Clave / SKU').focus();
    await d.getByLabel('Clave / SKU').blur();
    await expect(d.getByText('La clave es requerida')).toBeVisible();
    await d.getByLabel('Código de Barras').focus();
    await d.getByLabel('Código de Barras').blur();
    await expect(d.getByText('El código de barras es requerido')).toBeVisible();
    await d.getByLabel('Marca').focus();
    await d.getByLabel('Marca').blur();
    await expect(d.getByText('La marca es requerida')).toBeVisible();

    await d.getByLabel('Precio de Venta').fill('-5');
    await d.getByLabel('Precio de Venta').blur();
    await expect(d.getByText('Precio inválido')).toBeVisible();
    await d.getByLabel('Costo (Compra)').fill('-1');
    await d.getByLabel('Costo (Compra)').blur();
    await expect(d.getByText('Costo inválido')).toBeVisible();
    await expect(d.getByLabel('Código SAT (Opcional)')).toHaveAttribute('maxlength', '8');
    await expect(crear).toBeDisabled();

    // Todo válido salvo la categoría → sigue deshabilitado; con categoría se habilita (no se envía)
    await llenarProducto(page, { nombre: 'Producto válido', clave: 'X-1', barras: '123', marca: 'M', costo: '10', precio: '20' });
    await expect(crear).toBeDisabled();
    await d.getByLabel('Categoría').selectOption({ index: 1 });
    await expect(crear).toBeEnabled();

    await d.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo(page)).toHaveCount(0);
    expect(posts).toEqual([]);
  });

  test('FLU-INV-004a el back rechaza lo que el formulario no manda: sin tipo, sin proveedor, sin clave ni código de barras', async () => {
    const p = await crearProductoApi();
    const base = { ...p, clave: `E2E-INV-${sufijo}-v${n}`, codigo_barras: `750V${n}` };
    delete (base as { id?: number }).id;

    const sinTipo = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, id_tipo: null });
    expect([sinTipo.status, sinTipo.body.error]).toEqual([400, 'Faltan campos obligatorios: id_tipo']);
    const sinProv = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, id_proveedor: null });
    expect([sinProv.status, sinProv.body.error]).toEqual([400, 'Faltan campos obligatorios: id_proveedor']);
    const sinClave = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, clave: undefined });
    expect(sinClave.status).toBe(400);
    const sinBarras = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, codigo_barras: null });
    expect(sinBarras.status).toBe(400);
    // Los dos opcionales NO aceptan null (H-F6-1): hay que mandar ''
    const nulos = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, descripcion: null, codigoSAT: null });
    expect(nulos.status).toBe(400);
    expect(nulos.body.error).toMatch(/NOT NULL constraint failed/);
    expect(sql(`select count(*) from producto_producto where clave='${base.clave}'`)).toBe('0');
  });

  test.fixme('FLU-INV-004b el back rechaza precio negativo, nombre vacío y un id_tipo inexistente — H-F6-7', async () => {
    // H-F6-7 (BACK): precio_venta -5 → 201; nombre "" → 201; id_tipo 999 → 201 con id_tipo null (se pierde sin avisar).
    const p = await crearProductoApi();
    const base = { ...p, codigo_barras: `750W${unico()}` };
    delete (base as { id?: number }).id;
    for (const [i, extra] of [{ precio_venta: -5 }, { nombre: '' }, { id_tipo: 999 }].entries()) {
      const r = await apiFetch(ADMIN, 'POST', 'productos/', { ...base, clave: `E2E-INV-${sufijo}-neg${i}${n}`, ...extra });
      if (r.body?.id) productos.push(r.body.id);
      expect(r.status, JSON.stringify(extra)).toBe(400);
    }
  });

  // ───────────────────────── FLU-INV-005: duplicados ─────────────────────────

  test('FLU-INV-005 el back rechaza una clave duplicada con 400 y no crea el segundo producto', async () => {
    const p = await crearProductoApi();
    const dup = { ...p, codigo_barras: `750DUP${unico()}` };
    delete (dup as { id?: number }).id;

    const r = await apiFetch(ADMIN, 'POST', 'productos/', dup);

    expect(r.status).toBe(400);
    // El mensaje es el error crudo de la BD, sin traducir (la UI lo mostraría tal cual)
    expect(r.body.error).toContain('UNIQUE constraint failed: producto_producto.clave');
    expect(sql(`select count(*) from producto_producto where clave='${p.clave}'`)).toBe('1');
  });

  test.fixme('FLU-INV-005b la UI muestra el mensaje del back al crear con clave duplicada — H-F6-1 / H-F6-12', async ({ page }) => {
    // Depende de H-F6-1 (hoy el back ya responde 400 por id_proveedor antes de validar la clave) y de H-F6-12:
    // aun así, el 400 no produce ningún toast (verificado: 8 s sin toast, consola con NG0600).
    const p = await crearProductoApi();
    await darStock(p.id);
    await abrirInventario(page);

    await page.getByRole('button', { name: 'Añadir Producto' }).click();
    await llenarProducto(page, { nombre: 'Duplicado UI', clave: p.clave, barras: `750DUPUI${n}`, marca: 'E2E', costo: '1', precio: '2', categoria: 'Frenos' });
    await dialogo(page).getByRole('button', { name: 'Crear Producto' }).click();

    await expect(toast(page)).toContainText(/clave/i);
    expect(sql(`select count(*) from producto_producto where clave='${p.clave}'`)).toBe('1');
  });

  test.fixme('FLU-INV-005c el back rechaza un código de barras duplicado — H-F6-8', async () => {
    // H-F6-8 (BACK): `Producto.codigo_barras` no es único: el segundo alta devuelve 201 y `GET productos/codigo-barras/` devuelve solo uno de los dos.
    const p = await crearProductoApi();
    const dup = { ...p, clave: `E2E-INV-${sufijo}-dupb${n}` };
    delete (dup as { id?: number }).id;

    const r = await apiFetch(ADMIN, 'POST', 'productos/', dup);
    if (r.body?.id) productos.push(r.body.id);

    expect(r.status).toBe(400);
  });

  // ───────────────────────── FLU-INV-006: el producto nuevo llega al POS ─────────────────────────

  test('FLU-INV-006 un producto nuevo con stock en Centro aparece en el POS de Centro con su precio y se agrega al carrito; Norte no lo ve', async ({ page, browser }) => {
    const p = await crearProductoApi({ precio_venta: 77 });

    // Sin stock en la sucursal → el POS no lo ofrece
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    await loginAsReal(page, CAJERO);
    await page.goto('/sales');
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: /buscar/i }).fill(p.nombre);
    await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: p.nombre }) })).toHaveCount(0);

    await darStock(p.id, 20, CENTRO);
    await page.reload();
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: /buscar/i }).fill(p.nombre);
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: p.nombre }) });
    await expect(card).toBeVisible();
    await expect(card).toContainText('77');
    await card.getByRole('button', { name: 'Añadir' }).click();
    await expect(page.getByRole('complementary', { name: 'Detalle de venta' }).locator('app-cart-item').filter({ hasText: p.nombre })).toBeVisible();

    // Norte (sin stock del producto) no lo ve
    const ctx = await browser.newContext();
    const norte = await ctx.newPage();
    await loginAsReal(norte, TEST_USERS.mariaNorte);
    await norte.goto('/sales');
    await expect(norte.getByRole('article').first()).toBeVisible({ timeout: 30_000 });
    await norte.getByRole('textbox', { name: /buscar/i }).fill(p.nombre);
    await expect(norte.getByRole('article').filter({ has: norte.getByRole('heading', { name: p.nombre }) })).toHaveCount(0);
    await ctx.close();
  });
});
