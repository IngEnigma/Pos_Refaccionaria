/**
 * FLU-VEN — Punto de venta contra backend REAL local (plan-pruebas-flujos-e2e.md §3.2).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Verifica en dos niveles: UI (carrito, ticket) y BD (`E2E_DB` + `sqlite3`: venta, método, sucursal, stock).
 * Cada prueba mide el stock antes/después; solo E2E-ZERO y E2E-ULT están dedicados a un caso.
 */
import { expect, Locator, Page, test } from '@playwright/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { apiFetch, DB, fijarStock, loginAsReal, MetodoPago, metodosPago, productoId, sql, stockDe } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const A = { clave: 'E2E-002', nombre: 'Filtro E2E', codigoBarras: '750E2E002', precio: 80 };
const B = { clave: 'E2E-003', nombre: 'Bujía E2E', precio: 45 };
const SUCURSALES = [1, 2, 3];
const CAJEROS: { user: TestUser; sucursal: number }[] = [
  { user: TEST_USERS.anaCentro, sucursal: 1 },
  { user: TEST_USERS.mariaNorte, sucursal: 2 },
  { user: TEST_USERS.luisSur, sucursal: 3 },
];

const panel = (page: Page) => page.getByRole('complementary', { name: 'Detalle de venta' });
const card = (page: Page, nombre: string) =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre }) });
const addToCart = (page: Page, nombre: string) => card(page, nombre).getByRole('button', { name: 'Añadir' }).click();
const processBtn = (page: Page) => panel(page).getByRole('button', { name: 'Procesar transacción' });
const lineaCarrito = (page: Page, nombre: string): Locator => panel(page).locator('app-cart-item').filter({ hasText: nombre });
const cantidad = (page: Page, nombre: string) => lineaCarrito(page, nombre).getByTitle('Cantidad');
const money = (n: number) => `$${n.toFixed(2)}`;

/** Procesa la venta y devuelve la respuesta del POST (el ticket ya quedó abierto). */
async function procesar(page: Page) {
  const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
  await processBtn(page).click();
  const res = await posted;
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: number; total: string };
}

async function entrar(page: Page, user: TestUser) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/sales');
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Ventas flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  for (const { user, sucursal } of CAJEROS) {
    test(`FLU-VEN-001 matriz ${user.username} (sucursal ${sucursal}) × métodos de pago`, async ({ page }) => {
      const metodos: MetodoPago[] = await metodosPago();
      expect(metodos.length).toBeGreaterThan(0);

      for (const metodo of metodos) {
        await test.step(`método ${metodo.tipo}`, async () => {
          const antes = SUCURSALES.map((s) => stockDe(A.clave, s));
          await entrar(page, user);

          await addToCart(page, A.nombre);
          await addToCart(page, B.nombre);
          await lineaCarrito(page, A.nombre).getByRole('button', { name: '+' }).click();
          await expect(cantidad(page, A.nombre)).toHaveText('2');
          await page.getByRole('button', { name: `Quitar ${B.nombre} del carrito` }).click();
          await expect(lineaCarrito(page, B.nombre)).toHaveCount(0);
          await lineaCarrito(page, A.nombre).getByRole('button', { name: '−' }).click();
          await expect(cantidad(page, A.nombre)).toHaveText('1');
          await lineaCarrito(page, A.nombre).getByRole('button', { name: '+' }).click();
          await expect(cantidad(page, A.nombre)).toHaveText('2');

          const totalEsperado = 2 * A.precio * 1.16;
          await expect(panel(page).locator('.total-amount')).toHaveText(money(totalEsperado));
          await panel(page).getByRole('button', { name: metodo.tipo, exact: true }).click();
          const venta = await procesar(page);

          // Ticket = total del carrito
          await expect(page.getByRole('heading', { name: new RegExp(`Ticket #${venta.id}`) })).toBeVisible();
          await expect(page.locator('.total-value')).toHaveText(`MX${money(totalEsperado)}`);
          await expect(page.locator('.ticket-meta')).toContainText(metodo.tipo);

          // BD: ese método, esa sucursal, ese cajero, ese total
          const fila = sql(
            `select id_metodo_pago_id||'|'||id_sucursal_id||'|'||(select username from auth_user where id=id_usuario_id)||'|'||total from ventas_venta where id=${venta.id}`,
          ).split('|');
          expect(fila.slice(0, 3)).toEqual([String(metodo.id), String(sucursal), user.username]);
          expect(Number(fila[3])).toBeCloseTo(totalEsperado, 2);
          expect(sql(`select cantidad from ventas_detalleventa where id_venta_id=${venta.id} and id_producto_id=${productoId(A.clave)}`)).toBe('2');
          expect(sql(`select count(*) from ventas_detalleventa where id_venta_id=${venta.id}`)).toBe('1'); // B se quitó

          // Stock: -2 solo en la sucursal del cajero
          const despues = SUCURSALES.map((s) => stockDe(A.clave, s));
          expect(despues).toEqual(antes.map((v, i) => (SUCURSALES[i] === sucursal ? v - 2 : v)));
        });
      }
    });
  }

  test('FLU-VEN-002 la búsqueda filtra el catálogo y el producto se agrega al carrito', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    await page.getByRole('textbox', { name: /buscar/i }).fill('Filtro');
    await expect(card(page, A.nombre)).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(1);

    await addToCart(page, A.nombre);
    await expect(lineaCarrito(page, A.nombre)).toBeVisible();
    await expect(cantidad(page, A.nombre)).toHaveText('1');
  });

  test('FLU-VEN-003 código de barras + Enter agrega; uno desconocido avisa', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    const barcode = page.getByPlaceholder('Escanear código de barras...');

    await barcode.fill(A.codigoBarras);
    await barcode.press('Enter');
    await expect(page.getByText(`${A.nombre} agregado al carrito`)).toBeVisible();
    await expect(cantidad(page, A.nombre)).toHaveText('1');

    await barcode.fill('0000');
    await barcode.press('Enter');
    await expect(page.getByText('Producto no encontrado en tu sucursal o sin stock')).toBeVisible();
    await expect(panel(page).locator('app-cart-item')).toHaveCount(1);
  });

  test('FLU-VEN-004 el carrito se topa en el stock disponible', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    const nombre = 'Stock Bajo E2E';
    const stock = Number((await card(page, nombre).locator('.product-stock').innerText()).trim());
    expect(stock).toBeGreaterThan(0);

    for (let i = 0; i < stock + 3; i++) await addToCart(page, nombre);
    await expect(cantidad(page, nombre)).toHaveText(String(stock));
    await lineaCarrito(page, nombre).getByRole('button', { name: '+' }).click();
    await expect(cantidad(page, nombre)).toHaveText(String(stock));
    await lineaCarrito(page, nombre).getByRole('button', { name: '−' }).click();
    await expect(cantidad(page, nombre)).toHaveText(String(stock - 1));
  });

  test('FLU-VEN-005 un producto sin existencias no se puede agregar', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    expect(stockDe('E2E-ZERO', 1)).toBe(0);

    await expect(card(page, 'Sin Stock E2E').getByRole('button', { name: 'Añadir' })).toBeDisabled();
    await card(page, 'Sin Stock E2E').getByRole('button', { name: 'Añadir' }).click({ force: true });
    await expect(panel(page).getByText('No hay productos agregados.')).toBeVisible();

    const barcode = page.getByPlaceholder('Escanear código de barras...');
    await barcode.fill('750E2EZERO');
    await barcode.press('Enter');
    await expect(page.getByText('Producto sin existencias en esta sucursal')).toBeVisible();
    await expect(panel(page).getByText('No hay productos agregados.')).toBeVisible();
  });

  test('FLU-VEN-006 carrito vacío o sin método de pago no se puede procesar', async ({ page }) => {
    // Con Efectivo disponible el POS lo preselecciona: se quita de la respuesta real para llegar al estado "sin método".
    await page.route(/\/api\/metodopago\/?$/, async (route) => {
      const res = await route.fetch();
      const metodos = ((await res.json()) as MetodoPago[]).filter((m) => m.tipo !== 'Efectivo');
      await route.fulfill({ response: res, json: metodos });
    });
    const ventasPost: string[] = [];
    page.on('request', (r) => r.method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()) && ventasPost.push(r.url()));
    await entrar(page, TEST_USERS.anaCentro);

    await expect(panel(page).getByText('No hay productos agregados.')).toBeVisible();
    await expect(processBtn(page)).toBeDisabled();
    await processBtn(page).click({ force: true });

    await addToCart(page, A.nombre);
    await expect(processBtn(page)).toBeDisabled(); // carrito con producto pero sin método
    await processBtn(page).click({ force: true });
    expect(ventasPost).toHaveLength(0);

    await panel(page).getByRole('button', { name: 'Tarjeta', exact: true }).click();
    await expect(processBtn(page)).toBeEnabled();
  });

  test('FLU-VEN-007 subtotal, IVA 16 % y total coinciden con el total que guarda el backend', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    await addToCart(page, A.nombre);
    await addToCart(page, A.nombre);
    await addToCart(page, B.nombre);

    const subtotal = 2 * A.precio + B.precio;
    await expect(panel(page).getByText('Subtotal').locator('..')).toContainText(money(subtotal));
    await expect(panel(page).getByText('IVA').locator('..')).toContainText(money(subtotal * 0.16));
    await expect(panel(page).locator('.total-amount')).toHaveText(money(subtotal * 1.16));

    const venta = await procesar(page);
    expect(Number(sql(`select total from ventas_venta where id=${venta.id}`))).toBeCloseTo(subtotal * 1.16, 2);
    expect(Number(sql(`select iva from ventas_venta where id=${venta.id}`))).toBeCloseTo(subtotal * 0.16, 2);
    await expect(page.locator('.total-value')).toHaveText(`MX${money(subtotal * 1.16)}`);
  });

  test('FLU-VEN-008 la sucursal con precio propio cobra ese precio; las demás el base', async ({ browser }) => {
    // Balata E2E: base $100, precio propio $120 en Centro.
    const casos = [
      { user: TEST_USERS.anaCentro, precio: 120, sucursalBadge: true },
      { user: TEST_USERS.mariaNorte, precio: 100, sucursalBadge: false },
    ];
    for (const { user, precio, sucursalBadge } of casos) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await entrar(page, user);

      const balata = card(page, 'Balata E2E');
      await expect(balata).toContainText(money(precio));
      await expect(balata.getByText('Sucursal', { exact: true })).toHaveCount(sucursalBadge ? 1 : 0);
      await addToCart(page, 'Balata E2E');
      await expect(panel(page).locator('.total-amount')).toHaveText(money(precio * 1.16));
      const venta = await procesar(page);
      expect(Number(sql(`select total from ventas_venta where id=${venta.id}`))).toBeCloseTo(precio * 1.16, 2);
      await ctx.close();
    }
  });

  test('FLU-VEN-009 dos cajeros de la misma sucursal venden el último stock: el segundo recibe el rechazo y su carrito se conserva', async ({ browser }) => {
    fijarStock('E2E-ULT', 1, 1);
    const ventasAntes = Number(sql(`select count(*) from ventas_detalleventa where id_producto_id=${productoId('E2E-ULT')}`));
    const ctxAna = await browser.newContext();
    const ctxCarlos = await browser.newContext();
    const ana = await ctxAna.newPage();
    const carlos = await ctxCarlos.newPage();
    try {
      await entrar(ana, TEST_USERS.anaCentro);
      await entrar(carlos, TEST_USERS.carlosCentro);
      for (const p of [ana, carlos]) {
        await expect(card(p, 'Ultima Pieza E2E').locator('.product-stock')).toHaveText('1');
        await addToCart(p, 'Ultima Pieza E2E');
        await expect(cantidad(p, 'Ultima Pieza E2E')).toHaveText('1');
      }

      const venta = await procesar(ana); // gana: se lleva la última pieza
      await expect(ana.getByRole('heading', { name: new RegExp(`Ticket #${venta.id}`) })).toBeVisible();
      expect(stockDe('E2E-ULT', 1)).toBe(0);

      // Carlos todavía ve stock 1 (su inventario ya estaba cargado): el back lo rechaza
      const rechazo = carlos.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
      await processBtn(carlos).click();
      expect((await rechazo).status()).toBe(400);

      await expect(carlos.locator('.toast-message').first()).toContainText(/stock/i);
      await expect(carlos.getByRole('heading', { name: /Ticket #/ })).toHaveCount(0);
      await expect(cantidad(carlos, 'Ultima Pieza E2E')).toHaveText('1'); // carrito conservado
      await expect(processBtn(carlos)).toBeEnabled();

      // Solo se vendió una pieza y el stock no quedó negativo
      expect(Number(sql(`select count(*) from ventas_detalleventa where id_producto_id=${productoId('E2E-ULT')}`))).toBe(ventasAntes + 1);
      expect(stockDe('E2E-ULT', 1)).toBe(0);
    } finally {
      await ctxAna.close();
      await ctxCarlos.close();
    }
  });

  test('FLU-VEN-010 el ticket de una venta se puede volver a abrir', async ({ page }) => {
    await entrar(page, TEST_USERS.anaCentro);
    await addToCart(page, A.nombre);
    const venta = await procesar(page);
    const totalTicket = await page.locator('.total-value').innerText();

    await page.getByRole('button', { name: 'Cerrar', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Ticket #/ })).toHaveCount(0);

    // El ticket se vuelve a consultar al backend (mismo folio y total)…
    const ticket = await apiFetch(TEST_USERS.anaCentro, 'GET', `ventas/${venta.id}/ticket/`);
    expect(ticket.status).toBe(200);
    expect(ticket.body).toMatchObject({ folio: venta.id, vendedor: 'ana.centro' });
    expect(`MX$${Number(ticket.body.total).toFixed(2)}`).toBe(totalTicket);

    // …y desde el historial se abre su detalle.
    await page.getByRole('link', { name: 'Historial' }).click();
    await expect(page).toHaveURL(/\/history$/);
    await page.getByRole('row').filter({ has: page.getByText(`#${venta.id}`, { exact: true }) }).getByRole('button', { name: 'Detalle' }).click();
    await expect(page.getByRole('heading', { name: `Folio #${venta.id}` })).toBeVisible();
  });
});
