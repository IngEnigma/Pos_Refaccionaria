/**
 * Toma las capturas del manual de usuario contra la app en http://localhost:4200
 * (con `npm start` corriendo) y el backend de pruebas en Render.
 *
 * Uso (cuenta de GERENTE/encargado con sucursal asignada):
 *   TRT_USER=usuario TRT_PASS='clave' node docs/manual/capturar.mjs
 *
 * Opcional: TRT_VENDER=0 para NO registrar la venta de prueba (sin captura del ticket).
 * Las capturas quedan en docs/manual/img/. Un paso que falla se reporta y el resto continúa.
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { TRT_USER, TRT_PASS, TRT_VENDER = '1', BASE_URL = 'http://localhost:4200' } = process.env;
if (!TRT_USER || !TRT_PASS) {
  console.error('Faltan TRT_USER y TRT_PASS. Ej: TRT_USER=gerente TRT_PASS=\'...\' node docs/manual/capturar.mjs');
  process.exit(1);
}

const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), 'img');
const API = 'https://refaccionariaback.onrender.com';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
let fallos = 0;
page.on('response', (r) => r.status() >= 400 && console.log(`   [HTTP ${r.status()}] ${r.request().method()} ${r.url()}`));

// TRT_API_LOCAL=http://127.0.0.1:8000 → las peticiones a Render se sirven desde un backend local (sin tocar el front).
const { TRT_API_LOCAL } = process.env;
if (TRT_API_LOCAL) {
  await page.route(`${API}/**`, async (route) => {
    const response = await route.fetch({ url: route.request().url().replace(API, TRT_API_LOCAL) });
    await route.fulfill({ response });
  });
}

const shot = (name, locator) =>
  (locator ?? page).screenshot({ path: path.join(IMG, `${name}.png`), animations: 'disabled' });

const settle = async () => {
  // Las notificaciones hacen polling: networkidle puede no llegar nunca, de ahí el catch.
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1200);
};

async function paso(nombre, fn) {
  try {
    await fn();
    console.log('✓', nombre);
  } catch (e) {
    fallos++;
    console.log('✗', nombre, '→', String(e.message).split('\n')[0]);
    await shot(`fallo-${nombre.split(' ')[0]}`).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
  }
}

async function ir(ruta, esperar) {
  // Navegar por el menú lateral (como el usuario): con page.goto, Inventario Sucursal carga
  // antes de tener la sucursal del perfil y se queda vacío.
  await page.locator(`app-sidebar a[href="${ruta}"]`).click();
  if (esperar) await page.locator(esperar).first().waitFor({ timeout: 60_000 });
  await settle();
}

const cancelar = () => page.getByRole('button', { name: 'Cancelar' }).last().click();

// ── Despertar Render (plan gratuito: hasta ~1 min) ──
console.log('Despertando backend…');
for (let i = 0; i < 4; i++) {
  const r = await page.request.get(API, { timeout: 60_000 }).catch(() => null);
  if (r && r.status() < 500) break;
}

// ── Login ──
await paso('login', async () => {
  await page.goto(BASE_URL + '/login');
  await settle();
  await shot('login');
  await page.getByRole('textbox', { name: 'Ingresa tu usuario' }).fill(TRT_USER);
  await page.getByRole('textbox', { name: 'Ingresa tu contraseña' }).fill(TRT_PASS);
  // "Recordar sesión" deja la sesión en localStorage → page.goto() no la pierde.
  await page.getByLabel('Recordar sesión').check();
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(/\/sales/, { timeout: 120_000 });
});
if (!page.url().includes('/sales')) {
  console.error('No se pudo iniciar sesión; reviso login-fallo.png');
  await shot('login-fallo');
  await browser.close();
  process.exit(1);
}

// ── Punto de venta ──
await paso('pos', async () => {
  await page.locator('app-product-card').first().waitFor({ timeout: 90_000 });
  await settle();
  await shot('pos');
  await shot('menu-lateral', page.locator('app-sidebar'));
  await shot('barra-superior', page.locator('app-navbar'));
});

await paso('pos-carrito', async () => {
  await page.locator('app-product-card button:not([disabled])').first().click();
  await page.locator('app-cart-item').first().waitFor();
  await page.locator('app-cart-item .qty-circle').last().click(); // +1 para mostrar cantidad 2
  await page.locator('.payment-btn').first().click();
  await page.waitForTimeout(500);
  await shot('pos-carrito');
  await shot('pos-panel', page.locator('app-cart-panel'));
});

await paso('pos-cliente', async () => {
  await page.getByRole('button', { name: 'Cambiar cliente' }).click();
  await page.getByRole('dialog', { name: 'Seleccionar cliente' }).waitFor();
  await settle();
  await shot('pos-cliente');
  await page.getByRole('button', { name: /Público general/ }).click();
});

if (TRT_VENDER !== '0') {
  await paso('pos-ticket (registra 1 venta de prueba)', async () => {
    await page.getByRole('button', { name: 'Procesar transacción' }).click();
    await page.getByText('Venta exitosa').waitFor({ timeout: 60_000 });
    await page.waitForTimeout(1000);
    await shot('pos-ticket');
    await page.locator('app-ticket-modal .btn-secondary').click();
  });
}

// ── Inventario ──
await paso('inventario', async () => {
  await ir('/inventory', 'app-inventory-product-card');
  await shot('inventario');
});
await paso('inventario-nuevo', async () => {
  await page.getByRole('button', { name: /Añadir Producto/ }).click();
  await page.locator('.product-form-container').waitFor();
  await page.waitForTimeout(500);
  await shot('inventario-nuevo');
  await cancelar();
});
await paso('inventario-precio', async () => {
  await page.getByRole('button', { name: 'Cambiar precio sucursal' }).first().click();
  await page.getByText('Fijar Precio de Sucursal').waitFor();
  await page.waitForTimeout(500);
  await shot('inventario-precio');
  await cancelar();
});

// ── Clientes ──
await paso('clientes', async () => {
  await ir('/clients', '.client-row');
  await shot('clientes');
  await page.locator('.btn-add-client').click();
  await page.locator('.client-form-container').waitFor();
  await page.waitForTimeout(500);
  await shot('clientes-nuevo');
  await cancelar();
});

// ── Proveedores ──
await paso('proveedores', async () => {
  await ir('/suppliers', '.supplier-row');
  await shot('proveedores');
  await page.locator('.btn-add-supplier').click();
  await page.locator('.supplier-form-container').waitFor();
  await page.waitForTimeout(500);
  await shot('proveedores-nuevo');
  await cancelar();
});

// ── Historial ──
await paso('historial', async () => {
  await ir('/history', '.badge-id');
  await shot('historial');
  await page.getByRole('button', { name: /Detalle/ }).first().click();
  await page.getByText('Productos Vendidos').waitFor();
  await settle();
  await shot('historial-detalle');
  await page.locator('app-sale-detail-modal .btn-secondary').click();
});

// ── Reportes ──
await paso('reportes', async () => {
  await ir('/reports', '#periodType');
  await page.locator('#periodType').selectOption('month');
  await page.waitForTimeout(500);
  await shot('reportes');
});

// ── Notificaciones y perfil ──
await paso('notificaciones', async () => {
  await ir('/notifications', '.notifications-page');
  await shot('notificaciones');
});
await paso('perfil', async () => {
  await page.getByRole('button', { name: 'Perfil' }).click();
  await page.getByText('Cerrar sesión').waitFor();
  await page.waitForTimeout(600); // fin de la animación del menú
  await page.screenshot({ path: path.join(IMG, 'perfil.png'), clip: { x: 1000, y: 0, width: 440, height: 200 } });
  await page.keyboard.press('Escape');
});

// ── Solo gerente ──
await paso('inventario-sucursal', async () => {
  await ir('/inventory-by-branch', '.inventory-table');
  await page.locator('.movements-skeleton, .table-skeleton').first().waitFor({ state: 'detached' });
  await page.waitForTimeout(2000);
  await shot('inventario-sucursal');
  await page.locator('.btn-movement').first().click();
  await page.locator('.movement-form-container').waitFor();
  await page.waitForTimeout(500);
  await shot('inventario-movimiento');
  await cancelar();
});
await paso('cajeros', async () => {
  await ir('/manager/cashiers', '.cashiers-root');
  await shot('cajeros');
});

await browser.close();
console.log(fallos ? `\n${fallos} paso(s) fallaron; revisar arriba.` : '\nListo: capturas en docs/manual/img/');
