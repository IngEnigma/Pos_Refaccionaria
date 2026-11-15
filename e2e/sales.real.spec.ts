/**
 * SMOKE contra backend REAL local: venta completa del cajero (H-38, H-39, H-40).
 *
 *   npm run e2e:local   (o E2E_REAL=1 API_BASE=http://127.0.0.1:8000 BASE_URL=... playwright test e2e/sales.real)
 *
 * Requiere el seed del backend: ana.centro (cajero, sucursal 1), método de pago "Efectivo" y el
 * producto "Balata E2E" (clave E2E-001) con stock y precio de sucursal ($120). Opcional
 * `E2E_DB=<ruta sqlite>`: además verifica en la base la venta, su detalle y el descuento de stock
 * (usa el CLI `sqlite3`).
 */
import { execFileSync } from 'node:child_process';

import { test, expect } from '@playwright/test';

import { DEFAULT_REAL_USER } from './fixtures/test-users';
import { wakeBackend } from './helpers/backend';

const REAL = process.env['E2E_REAL'] === '1';
const DB = process.env['E2E_DB'];
const PRODUCTO = 'Balata E2E';
const PRECIO = 120;

const sql = (q: string) => execFileSync('sqlite3', [DB!, q], { encoding: 'utf8' }).trim();
const stockSql =
  "select cantidad from inventario_stock where id_sucursal_id=1 and id_producto_id=(select id from producto_producto where clave='E2E-001')";

test.describe('Ventas REAL (backend local)', () => {
  test.skip(!REAL, 'Solo con E2E_REAL=1 (backend real)');
  test.slow();

  test('cajero vende 1 producto: venta creada, ticket = total del carrito y stock descontado', async ({ page }) => {
    test.skip(!(await wakeBackend(page)), 'Backend no disponible');
    const stockAntes = DB ? Number(sql(stockSql)) : null;

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(DEFAULT_REAL_USER.username);
    await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(DEFAULT_REAL_USER.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/sales/, { timeout: 30_000 });

    const panel = page.getByRole('complementary', { name: 'Detalle de venta' });
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: PRODUCTO }) });
    await card.getByRole('button', { name: 'Añadir' }).click();
    await expect(panel.locator('.total-amount')).toHaveText(`$${PRECIO}.00`); // H-40: sin IVA extra
    await panel.getByRole('button', { name: 'Efectivo' }).click();

    const posted = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/ventas\/?$/.test(r.url()));
    await panel.getByRole('button', { name: 'Procesar transacción' }).click();
    const res = await posted;
    expect(res.status()).toBe(201); // H-38/H-39: id_metodo_pago + detalles en un solo POST
    expect(res.request().postDataJSON()).toMatchObject({ detalles: [{ cantidad: 1 }] });
    const venta = await res.json();

    await expect(page.getByRole('heading', { name: new RegExp(`Ticket #${venta.id}`) })).toBeVisible();
    await expect(page.locator('.total-value')).toHaveText(`MX$${PRECIO}.00`);

    if (DB) {
      expect(Number(sql(`select total from ventas_venta where id=${venta.id}`))).toBe(PRECIO);
      expect(sql(`select estado from ventas_venta where id=${venta.id}`)).toBe('completada');
      expect(sql(`select cantidad from ventas_detalleventa where id_venta_id=${venta.id}`)).toBe('1');
      expect(Number(sql(stockSql))).toBe(stockAntes! - 1);
    }
  });
});
