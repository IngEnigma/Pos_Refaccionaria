/**
 * SISTEMA E2E — Precio diferenciado por sucursal (SIS-023). Con mocks, sin Render.
 * El backend se simula con estado: los precios fijados viven en un mapa sucursal → producto → precio.
 * El botón de la tabla dice "Fijar" (H-50); la regex tolera el typo antiguo.
 */
import { test, expect, Page } from '@playwright/test';

import { BRANCHES, INVENTARIO_MI_SUCURSAL, PRODUCTOS_SUCURSAL } from './fixtures/api-data';
import { loginAs, mockApi } from './helpers/backend';

const NORTE = 2;
const row = (page: Page, nombre: string) => page.getByRole('row', { name: new RegExp(nombre) });
const setPriceBtn = (page: Page, nombre: string) => row(page, nombre).getByRole('button', { name: /Fi[jx]ar/ });

async function setup(page: Page) {
  await loginAs(page, 'admin');
  const precios = new Map<string, string>(); // `${idSucursal}:${idProducto}` → precio
  await mockApi(page, '/sucursales', BRANCHES, 200, 'GET');
  await mockApi(page, '/productos', (call) => {
    const sid = Number(new URL(call.url).searchParams.get('sucursal_id'));
    return PRODUCTOS_SUCURSAL.filter((p) => p.id === 1).map((p) => ({
      ...p,
      id_sucursal: sid,
      precio_sucursal: precios.get(`${sid}:${p.id}`) ?? null,
      precio_venta: precios.get(`${sid}:${p.id}`) ?? p.precio_base,
    }));
  });
  const posts = await mockApi(
    page,
    '/precios-sucursal',
    (call) => {
      const b = call.body as { id_producto: number; id_sucursal: number; precio_venta: number };
      precios.set(`${b.id_sucursal}:${b.id_producto}`, b.precio_venta.toFixed(2));
      return { id: 10, ...b, precio_venta: b.precio_venta.toFixed(2), vigente_desde: '2026-11-13T10:00:00Z', activo: true };
    },
    201,
    'POST',
  );
  return { posts, precios };
}

async function selectBranch(page: Page, nombre: string) {
  await page.getByLabel('Sucursal:').selectOption({ label: nombre });
}

test.describe('Precios por sucursal — SIS-023', () => {
  test('sin sucursal elegida pide seleccionar una', async ({ page }) => {
    await setup(page);
    await page.goto('/branch-pricing');

    await expect(page.getByText('Selecciona una sucursal para gestionar sus precios.')).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('fija $110 a un producto en Norte, la tabla se recarga y Centro conserva el precio base', async ({ page }) => {
    const { posts } = await setup(page);
    await page.goto('/branch-pricing');

    await selectBranch(page, 'Norte — Calle Norte 45');
    await expect(row(page, 'Balata delantera')).toContainText('$100.00');
    await expect(row(page, 'Balata delantera')).toContainText('Sin precio');

    await setPriceBtn(page, 'Balata delantera').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Fijar Precio de Sucursal' })).toBeVisible();
    await dialog.getByLabel('Precio de Venta (MXN)').fill('110');
    await dialog.getByRole('button', { name: 'Fijar Precio' }).click();

    await expect(page.locator('.toast-message').filter({ hasText: 'Precio de sucursal actualizado correctamente' })).toBeVisible();
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({ id_producto: 1, id_sucursal: NORTE, precio_venta: 110 });
    await expect(row(page, 'Balata delantera')).toContainText('$110.00');
    await expect(row(page, 'Balata delantera')).toContainText('Activo');

    await selectBranch(page, 'Centro — Av Reforma 123');
    await expect(row(page, 'Balata delantera')).toContainText('Sin precio');
    await expect(row(page, 'Balata delantera')).not.toContainText('$110.00');
  });

  test('un precio de 0 no se puede fijar', async ({ page }) => {
    const { posts } = await setup(page);
    await page.goto('/branch-pricing');
    await selectBranch(page, 'Norte — Calle Norte 45');

    await setPriceBtn(page, 'Balata delantera').click();
    const dialog = page.getByRole('dialog');
    const price = dialog.getByLabel('Precio de Venta (MXN)');
    await price.fill('0');
    await price.blur();

    await expect(dialog.getByText('El precio debe ser mayor a $0.00')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Fijar Precio' })).toBeDisabled();
    expect(posts).toHaveLength(0);
  });

  test('el POS de una sucursal con precio propio cobra ese precio y marca "Sucursal"', async ({ page }) => {
    await setup(page);
    // Inventario de Norte con precio de sucursal $110 para la balata.
    const inv = INVENTARIO_MI_SUCURSAL[0];
    await mockApi(page, '/inventarios/mi-sucursal', [
      {
        ...inv,
        id_sucursal: NORTE,
        detalles: inv.detalles.map((d) => (d.id_producto === 1 ? { ...d, precio_sucursal: '110.00', precio_venta: '110.00' } : d)),
      },
    ]);
    await page.goto('/sales');

    const balata = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Balata delantera' }) });
    // H-52: la tarjeta imprime el precio con 2 decimales.
    await expect(balata).toContainText('$110.00');
    await expect(balata).toContainText('Sucursal');
    const filtro = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Filtro de aceite' }) });
    await expect(filtro).toContainText('$50.00');
    await expect(filtro).not.toContainText('Sucursal');
  });
});
