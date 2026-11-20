/**
 * FLU-NOT — Notificaciones contra backend REAL local (plan-pruebas-flujos-e2e.md §3.13).
 *
 *   npm run e2e:back   (otra terminal)  +  npm run e2e:flujos
 *
 * Las alertas las crea `notifications/services/stock_alerts.py` tras cada movimiento de stock (venta o entrada) y se
 * entregan a TODOS los perfiles de la sucursal del producto (cajeros, gerente y admin con perfil ahí), no solo a quien vendió.
 * El seed deja `E2E-LOW` con stock = umbral (10) + 2 = 12 en las 3 sucursales: una venta de 3 lo deja en 9 (LOW_STOCK) y de 12 en 0.
 * `GET /api/notifications/` lista también las alertas ya resueltas (no expone `resuelta_en`): la resolución se verifica en BD (H-F4-4).
 * Cada prueba borra las notificaciones de E2E-LOW, las ventas que creó y restaura el stock de ese producto.
 */
import { expect, Page, test } from '../helpers/test';

import { TEST_USERS, TestUser } from '../fixtures/test-users';
import { apiFetch, crearVentaApi, DB, fijarStock, loginAsReal, metodosPago, productoId, sql, stockDe } from '../helpers/api';
import { wakeBackend } from '../helpers/backend';

const P = { clave: 'E2E-LOW', nombre: 'Stock Bajo E2E' };
const CENTRO = 1;
const NORTE = 2;
const UMBRAL = 10;
/** Valor guardado de `Notification.Tipo`: LOW_STOCK = 'warning', OUT_OF_STOCK = 'error'. */
const TIPO = { LOW_STOCK: 'warning', OUT_OF_STOCK: 'error' } as const;
const RAZON = 'E2E notif entrada';

interface Notif {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
}

const dePuntoBajo = (n: Notif) => n.mensaje.includes(P.nombre);
const lista = async (user: TestUser) => ((await apiFetch(user, 'GET', 'notifications/')).body as Notif[]).filter(dePuntoBajo);
const idUsuario = (username: string) => Number(sql(`select id from auth_user where username='${username}'`));
const enBd = (idProducto: number, tipo: string) =>
  sql(`select count(*)||'|'||count(resuelta_en) from notifications_notification where ref_producto_id=${idProducto} and ref_sucursal_id=${CENTRO} and tipo='${tipo}'`);
const tarjeta = (page: Page, texto: string | RegExp) => page.getByRole('article').filter({ hasText: texto });
const insignia = (page: Page) => page.getByLabel(/\d+ notificaciones sin leer/);

async function abrir(page: Page, user: TestUser) {
  test.skip(!(await wakeBackend(page)), 'Backend no disponible');
  await loginAsReal(page, user);
  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: 'Notificaciones', level: 1 })).toBeVisible();
}

test.describe('Notificaciones flujos REAL (backend local)', () => {
  test.skip(process.env['E2E_REAL'] !== '1' || !DB, 'Solo con E2E_REAL=1 y E2E_DB (backend real local)');
  test.slow();

  let stocks: { centro: number; norte: number };
  let ventas: number[];
  let idP: number;
  const limpiar = () => {
    sql(`delete from notifications_notification where ref_producto_id=${idP}`);
    sql(`delete from inventario_movimientoinventario where razon like '${RAZON}%'`);
    if (ventas.length) {
      sql(`delete from ventas_detalleventa where id_venta_id in (${ventas.join(',')})`);
      sql(`delete from ventas_venta where id in (${ventas.join(',')})`);
    }
    ventas = [];
  };

  test.beforeEach(() => {
    idP = productoId(P.clave);
    ventas = [];
    stocks = { centro: stockDe(P.clave, CENTRO), norte: stockDe(P.clave, NORTE) };
    fijarStock(P.clave, CENTRO, UMBRAL + 2);
    fijarStock(P.clave, NORTE, UMBRAL + 2);
    limpiar();
  });
  test.afterEach(() => {
    limpiar();
    fijarStock(P.clave, CENTRO, stocks.centro);
    fijarStock(P.clave, NORTE, stocks.norte);
  });

  /** Venta de `cantidad` unidades de E2E-LOW en Centro como ana.centro. */
  async function vender(cantidad: number) {
    const [efectivo] = await metodosPago();
    const v = await crearVentaApi(TEST_USERS.anaCentro, efectivo.id, [{ clave: P.clave, cantidad }]);
    ventas.push(v.id);
  }

  /** Entrada de inventario de E2E-LOW en Centro por la UI de inventario por sucursal, como gerente. */
  async function entradaPorUi(page: Page, cantidad: number) {
    await loginAsReal(page, TEST_USERS.gerenteGeneral);
    await page.goto('/inventory-by-branch');
    const fila = page.getByRole('row').filter({ has: page.getByText(P.clave, { exact: true }) });
    await expect(fila).toBeVisible({ timeout: 30_000 });
    await fila.getByRole('button', { name: /Movimiento/ }).click();
    const d = page.getByRole('dialog');
    await d.getByLabel('Tipo de Movimiento').selectOption({ label: 'Entrada' });
    await d.getByLabel('Cantidad').fill(String(cantidad));
    await d.getByLabel('Razón').fill(`${RAZON} ${Date.now()}`);
    await d.getByRole('button', { name: 'Registrar Movimiento' }).click();
    await expect(page.locator('.toast-message').first()).toContainText('Movimiento registrado correctamente');
  }

  test('FLU-NOT-001 vender hasta dejar el producto bajo el umbral genera LOW_STOCK para la sucursal', async ({ page }) => {
    await vender(3); // 12 → 9
    expect(stockDe(P.clave, CENTRO)).toBe(UMBRAL - 1);

    const n = (await lista(TEST_USERS.anaCentro)).filter((x) => x.tipo === TIPO.LOW_STOCK);
    expect(n).toHaveLength(1);
    expect(n[0].leida).toBe(false);
    expect(n[0].titulo).toBe('Stock bajo');
    expect(n[0].mensaje).toContain(`quedan ${UMBRAL - 1} unidades en Centro`);
    expect(enBd(idP, TIPO.LOW_STOCK)).toBe('4|0'); // ana, carlos, gerente y admin de Centro; ninguna resuelta

    await abrir(page, TEST_USERS.anaCentro);
    const item = tarjeta(page, P.nombre);
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('Stock bajo');
    await expect(item).toContainText(`quedan ${UMBRAL - 1} unidades`);
    await expect(insignia(page)).toBeVisible();
  });

  test('FLU-NOT-002 vender hasta 0 resuelve LOW_STOCK y genera OUT_OF_STOCK', async ({ page }) => {
    await vender(3); // 12 → 9
    await vender(UMBRAL - 1); // 9 → 0
    expect(stockDe(P.clave, CENTRO)).toBe(0);

    expect(enBd(idP, TIPO.LOW_STOCK)).toBe('4|4'); // las 4 resueltas
    expect(enBd(idP, TIPO.OUT_OF_STOCK)).toBe('4|0'); // 4 activas
    const agotado = (await lista(TEST_USERS.anaCentro)).filter((x) => x.tipo === TIPO.OUT_OF_STOCK);
    expect(agotado).toHaveLength(1);
    expect(agotado[0].titulo).toBe('Producto agotado');

    await abrir(page, TEST_USERS.carlosCentro);
    await expect(tarjeta(page, `${P.nombre} se agotó en Centro.`)).toHaveCount(1);
  });

  test('FLU-NOT-003 una entrada de inventario que recupera el stock resuelve la alerta', async ({ page }) => {
    await vender(3); // 12 → 9 (LOW_STOCK)
    expect(enBd(idP, TIPO.LOW_STOCK)).toBe('4|0');

    // Entrada de 5 por la UI de inventario por sucursal, como gerente: 9 → 14 (≥ umbral)
    await entradaPorUi(page, 5);

    expect(stockDe(P.clave, CENTRO)).toBe(UMBRAL + 4);
    expect(enBd(idP, TIPO.LOW_STOCK)).toBe('4|4'); // resueltas, no borradas (historial)
    expect(enBd(idP, TIPO.OUT_OF_STOCK)).toBe('0|0');
  });

  test.fixme('FLU-NOT-003b una alerta resuelta ya no se muestra como pendiente en /notifications — H-F4-4', async ({ page }) => {
    // H-F4-4 (back): GET /api/notifications/ devuelve también las alertas resueltas y sin `resuelta_en`;
    // el front no puede distinguirlas y sigue mostrando "quedan 9 unidades" aunque el stock ya se recuperó.
    await vender(3);
    await entradaPorUi(page, 5);
    await abrir(page, TEST_USERS.anaCentro);
    await expect(tarjeta(page, P.nombre)).toHaveCount(0);
  });

  test('FLU-NOT-004 marcar una como leída, marcar todas y eliminar (con contador)', async ({ page }) => {
    await vender(3); // LOW_STOCK
    await vender(UMBRAL - 1); // → 0: otra alerta (OUT_OF_STOCK); la anterior queda como historial
    await abrir(page, TEST_USERS.anaCentro);

    const agotado = tarjeta(page, `${P.nombre} se agotó en Centro`);
    const bajo = tarjeta(page, `${P.nombre}: quedan`);
    await expect(agotado).toHaveCount(1);
    await expect(bajo).toHaveCount(1);

    const sinLeerAntes = ((await apiFetch(TEST_USERS.anaCentro, 'GET', 'notifications/')).body as Notif[]).filter((n) => !n.leida).length;
    expect(sinLeerAntes).toBeGreaterThanOrEqual(2);
    await expect(insignia(page)).toHaveText(String(sinLeerAntes));

    // Marcar una como leída: baja el contador y queda guardado
    await agotado.getByRole('button', { name: 'Marcar como leída' }).click();
    await expect(agotado.getByRole('button', { name: 'Marcar como leída' })).toHaveCount(0);
    await expect(insignia(page)).toHaveText(String(sinLeerAntes - 1));
    expect((await lista(TEST_USERS.anaCentro)).find((n) => n.tipo === TIPO.OUT_OF_STOCK)?.leida).toBe(true);
    expect((await lista(TEST_USERS.anaCentro)).find((n) => n.tipo === TIPO.LOW_STOCK)?.leida).toBe(false);

    // Marcar todas: desaparece el botón y la insignia
    await page.locator('.notifications-page').getByRole('button', { name: /Marcar todo como leído/ }).click();
    await expect(page.locator('.notifications-page').getByRole('button', { name: /Marcar todo como leído/ })).toHaveCount(0);
    await expect(insignia(page)).toHaveCount(0);
    expect(((await apiFetch(TEST_USERS.anaCentro, 'GET', 'notifications/')).body as Notif[]).every((n) => n.leida)).toBe(true);

    // Eliminar: sale de la lista y de la BD, solo la de ana (carlos conserva la suya)
    await bajo.getByRole('button', { name: 'Eliminar notificación' }).click();
    await expect(bajo).toHaveCount(0);
    expect((await lista(TEST_USERS.anaCentro)).map((n) => n.tipo)).toEqual([TIPO.OUT_OF_STOCK]);
    expect((await lista(TEST_USERS.carlosCentro)).map((n) => n.tipo).sort()).toEqual([TIPO.OUT_OF_STOCK, TIPO.LOW_STOCK].sort());

    await page.reload();
    await expect(tarjeta(page, `${P.nombre} se agotó en Centro`)).toHaveCount(1);
    await expect(bajo).toHaveCount(0);
  });

  test('FLU-NOT-005 cada usuario ve solo lo que le corresponde', async ({ page, browser }) => {
    await vender(3); // alerta en Centro; Norte y Sur siguen en 12

    // Destinatarios: exactamente los perfiles de Centro
    const destinatarios = sql(`select group_concat(nombre) from (select u.username as nombre from notifications_notification n join auth_user u on u.id=n.destinatario_id where n.ref_producto_id=${idP} order by u.username)`).split(',');
    expect(destinatarios).toEqual(['admin.e2e', 'ana.centro', 'carlos.centro', 'gerente.general']);

    for (const user of [TEST_USERS.anaCentro, TEST_USERS.carlosCentro, TEST_USERS.gerenteGeneral, TEST_USERS.adminE2e]) {
      expect(await lista(user), user.username).toHaveLength(1);
    }
    for (const user of [TEST_USERS.mariaNorte, TEST_USERS.luisSur, TEST_USERS.vendedorSinPerfil]) {
      expect(await lista(user), user.username).toHaveLength(0);
    }

    // UI: maria.norte no ve la alerta de Centro; ana sí
    await abrir(page, TEST_USERS.mariaNorte);
    await expect(tarjeta(page, P.nombre)).toHaveCount(0);
    const ctx = await browser.newContext();
    const ana = await ctx.newPage();
    await abrir(ana, TEST_USERS.anaCentro);
    await expect(tarjeta(ana, P.nombre)).toHaveCount(1);
    await ctx.close();

    // Lo ajeno no se toca: marcar/eliminar la notificación de carlos como maria o ana → 404 y sigue intacta
    const deCarlos = (await lista(TEST_USERS.carlosCentro))[0];
    for (const intruso of [TEST_USERS.mariaNorte, TEST_USERS.anaCentro]) {
      expect((await apiFetch(intruso, 'PATCH', `notifications/${deCarlos.id}/`, {})).status).toBe(404);
      expect((await apiFetch(intruso, 'DELETE', `notifications/${deCarlos.id}/`)).status).toBe(404);
    }
    expect(sql(`select leida from notifications_notification where id=${deCarlos.id}`)).toBe('0');
    expect(idUsuario('carlos.centro')).toBe(Number(sql(`select destinatario_id from notifications_notification where id=${deCarlos.id}`)));
  });
});
