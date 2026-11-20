/**
 * SISTEMA E2E — Punto de venta (SIS-010 a SIS-016). Todo con mocks (page.route), sin Render.
 *
 * Adaptaciones a la UI actual: el botón "Procesar transacción" nace deshabilitado con carrito
 * vacío o sin método de pago (SIS-011/012), y sin sucursal asignada la página no carga catálogo
 * (SIS-013). La venta es un solo POST /ventas/ con `detalles` e `id_metodo_pago` (H-38/H-39).
 */
import { test, expect, Page } from '@playwright/test';

import { INVENTARIO_MI_SUCURSAL, TICKET_77, VENTA_CREADA } from './fixtures/api-data';
import { loginAs, MockCall, mockApi } from './helpers/backend';

const cartPanel = (page: Page) => page.getByRole('complementary', { name: 'Detalle de venta' });
const card = (page: Page, nombre: string) =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name: nombre }) });
const addToCart = (page: Page, nombre: string) =>
  card(page, nombre).getByRole('button', { name: 'Añadir' }).click();
const processBtn = (page: Page) => cartPanel(page).getByRole('button', { name: 'Procesar transacción' });

/** Backend con estado: el stock baja y la venta queda en el historial cuando se hace el POST. */
async function setupPos(page: Page) {
  await loginAs(page, 'seller');
  const stock = new Map(INVENTARIO_MI_SUCURSAL[0].detalles.map((d) => [d.id_producto, d.cantidad]));
  const ventas: unknown[] = [];

  await mockApi(page, '/inventarios/mi-sucursal', () => [
    {
      ...INVENTARIO_MI_SUCURSAL[0],
      detalles: INVENTARIO_MI_SUCURSAL[0].detalles.map((d) => ({ ...d, cantidad: stock.get(d.id_producto) })),
    },
  ]);
  await mockApi(page, '/ventas', () => ventas, 200, 'GET');
  const posts = await mockApi(
    page,
    '/ventas',
    (call: MockCall) => {
      const body = call.body as { detalles: { id_producto: number; cantidad: number }[] };
      body.detalles.forEach((d) => stock.set(d.id_producto, (stock.get(d.id_producto) ?? 0) - d.cantidad));
      ventas.push(VENTA_CREADA);
      return VENTA_CREADA;
    },
    201,
    'POST',
  );
  await mockApi(page, '/ventas/77/ticket', TICKET_77);
  return { posts, stock };
}

test.describe('POS — ventas', () => {
  test('SIS-010 flujo feliz: vende 2 unidades, muestra el ticket, baja el stock y queda en el historial', async ({ page }) => {
    const { posts } = await setupPos(page);
    await page.goto('/sales');

    await expect(card(page, 'Balata delantera')).toBeVisible();
    await addToCart(page, 'Balata delantera');
    await addToCart(page, 'Balata delantera');
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('2');
    await cartPanel(page).getByRole('button', { name: 'Efectivo' }).click();
    await processBtn(page).click();

    await expect(page.getByRole('heading', { name: 'Ticket #77' })).toBeVisible();
    await expect(page.getByText('Venta exitosa')).toBeVisible();
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({ id_metodo_pago: 1, detalles: [{ id_producto: 1, cantidad: 2 }] });

    await page.getByRole('button', { name: 'Cerrar', exact: true }).first().click();
    await expect(cartPanel(page).getByText('No hay productos agregados.')).toBeVisible();
    await expect(card(page, 'Balata delantera')).toContainText('8'); // stock 10 → 8

    await page.getByRole('link', { name: 'Historial' }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText('#77')).toBeVisible();
  });

  test('SIS-011 con el carrito vacío no se puede procesar y no se llama al backend', async ({ page }) => {
    const { posts } = await setupPos(page);
    await page.goto('/sales');

    await expect(cartPanel(page).getByText('No hay productos agregados.')).toBeVisible();
    await expect(processBtn(page)).toBeDisabled();
    await processBtn(page).click({ force: true });
    expect(posts).toHaveLength(0);
  });

  test('SIS-012 sin método de pago no se puede procesar', async ({ page }) => {
    const { posts } = await setupPos(page);
    // Con "Efectivo" disponible el selector lo preselecciona; sin él, hay que elegir uno a mano.
    await mockApi(page, '/metodopago', [{ id: 2, tipo: 'Tarjeta', descripcion: 'Tarjeta' }]);
    await page.goto('/sales');

    await addToCart(page, 'Balata delantera');
    await expect(processBtn(page)).toBeDisabled();
    await cartPanel(page).getByRole('button', { name: 'Tarjeta' }).click();
    await expect(processBtn(page)).toBeEnabled();
    expect(posts).toHaveLength(0);
  });

  test('SIS-013 sin sucursal asignada no hay catálogo ni venta posible', async ({ page }) => {
    await setupPos(page);
    await mockApi(page, '/perfil', { id: 1, id_usuario: 1, id_sucursal: null });
    const inventario = await mockApi(page, '/inventarios/mi-sucursal', INVENTARIO_MI_SUCURSAL);
    await page.goto('/sales');

    await expect(page.getByText('Tu usuario no tiene sucursal asignada.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(processBtn(page)).toBeDisabled();
    expect(inventario).toHaveLength(0);
  });

  test('SIS-014 el carrito se topa en el stock disponible', async ({ page }) => {
    await setupPos(page);
    await page.goto('/sales');

    for (let i = 0; i < 5; i++) await addToCart(page, 'Faro delantero'); // stock 3
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('3');
    await cartPanel(page).getByRole('button', { name: '+' }).click();
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('3');
    await cartPanel(page).getByRole('button', { name: '−' }).click();
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('2');
  });

  test('SIS-014 un producto sin existencias no se puede añadir', async ({ page }) => {
    await setupPos(page);
    await page.goto('/sales');

    await expect(card(page, 'Bujía NGK').getByRole('button', { name: 'Añadir' })).toBeDisabled();
  });

  test('SIS-015 subtotal, IVA 16 % y total del carrito (1 × $100 + 2 × $50)', async ({ page }) => {
    await setupPos(page);
    await page.goto('/sales');

    await addToCart(page, 'Balata delantera');
    await addToCart(page, 'Filtro de aceite');
    await addToCart(page, 'Filtro de aceite');

    const panel = cartPanel(page);
    await expect(panel.getByText('Subtotal').locator('..')).toContainText('$200.00');
    await expect(panel.getByText('IVA').locator('..')).toContainText('$32.00');
    await expect(panel.getByText('Total', { exact: true }).locator('..')).toContainText('$232.00');
  });

  test('H-40: el total del carrito coincide con el total del ticket del backend', async ({ page }) => {
    // El backend suma el IVA a los subtotales (200 + 32 = $232) y el carrito cobra lo mismo.
    await setupPos(page);
    await mockApi(page, '/ventas/77/ticket', { ...TICKET_77, subtotal: '200.00', iva: '32.00', total: '232.00' });
    await page.goto('/sales');

    await addToCart(page, 'Balata delantera');
    await addToCart(page, 'Filtro de aceite');
    await addToCart(page, 'Filtro de aceite');
    // innerText() no espera: se confirma primero el total esperado ((2 × $50 + $100) × 1.16) con auto-espera.
    const total = cartPanel(page).locator('.total-amount');
    await expect(total).toHaveText('$232.00');
    const totalCarrito = await total.innerText();
    await cartPanel(page).getByRole('button', { name: 'Efectivo' }).click();
    await processBtn(page).click();

    await expect(page.locator('.total-value')).toHaveText(`MX${totalCarrito}`); // el modal usa el símbolo MX$ (currency MXN)
  });

  test('SIS-016 el buscador filtra el catálogo y el producto se agrega al carrito', async ({ page }) => {
    await setupPos(page);
    await page.goto('/sales');

    await page.getByRole('textbox', { name: /buscar/i }).fill('fil');
    await expect(card(page, 'Filtro de aceite')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(1);

    await addToCart(page, 'Filtro de aceite');
    await expect(cartPanel(page).getByText('Filtro de aceite')).toBeVisible();
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('1');
  });

  test('SIS-016 el código de barras + Enter agrega el producto; uno desconocido avisa', async ({ page }) => {
    await setupPos(page);
    await page.goto('/sales');

    const barcode = page.getByRole('banner').getByPlaceholder('Buscar...');
    await expect(barcode).toBeFocused(); // el lector escribe donde está el foco
    await barcode.fill('7501');
    await barcode.press('Enter');
    await expect(page.getByText('Balata delantera agregado al carrito')).toBeVisible();
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('1');
    await expect(barcode).toHaveValue('');

    await barcode.fill('0000');
    await barcode.press('Enter');
    await expect(page.getByText('Producto no encontrado en tu sucursal o sin stock')).toBeVisible();
  });

  test('SIS-010 si el backend rechaza la venta (400) muestra el error y conserva el carrito', async ({ page }) => {
    await setupPos(page);
    // H-49: sin provideAnimations() cada toast lanza NG05105 y el de error salía sin texto.
    const animationErrors: string[] = [];
    page.on('console', (m) => {
      if (m.text().includes('NG05105')) animationErrors.push(m.text());
    });
    await mockApi(page, '/ventas', { error: 'Stock insuficiente para Balata delantera' }, 400, 'POST');
    await page.goto('/sales');

    await addToCart(page, 'Balata delantera');
    await cartPanel(page).getByRole('button', { name: 'Efectivo' }).click();
    await processBtn(page).click();

    await expect(page.locator('.toast-message').first()).toContainText(/stock/i);
    await expect(page.getByRole('heading', { name: /Ticket #/ })).toHaveCount(0);
    await expect(cartPanel(page).getByTitle('Cantidad')).toHaveText('1');
    expect(animationErrors).toEqual([]);
  });
});
