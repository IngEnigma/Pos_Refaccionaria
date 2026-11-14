/**
 * Datos mock de la API para los E2E con mocks (Fase 6). Formas tomadas de los DTO del front
 * (snake_case del backend); no dependen de Render.
 */

export const SUCURSAL_ID = 1;

export const PAYMENT_METHODS = [
  { id: 1, tipo: 'Efectivo', descripcion: 'Pago en efectivo' },
  { id: 2, tipo: 'Tarjeta', descripcion: 'Tarjeta de débito o crédito' },
];

export const PRODUCT_TYPES = [
  { id: 1, nombre: 'Frenos' },
  { id: 2, nombre: 'Motor' },
];

/** Inventario de la sucursal 1 (`GET /inventarios/mi-sucursal/`). */
export const INVENTARIO_MI_SUCURSAL = [
  {
    id_inventario: 1,
    descripcion: 'Inventario Centro',
    id_sucursal: SUCURSAL_ID,
    detalles: [
      inventoryItem(1, 'Balata delantera', 'BAL-001', '7501', '100.00', null, 10),
      inventoryItem(2, 'Filtro de aceite', 'FIL-002', '7502', '50.00', null, 5),
      inventoryItem(3, 'Bujía NGK', 'BUJ-003', '7503', '30.00', null, 0),
      inventoryItem(4, 'Amortiguador', 'AMO-004', '7504', '400.00', '350.00', 5),
      inventoryItem(5, 'Faro delantero', 'FAR-005', '7505', '80.00', null, 3),
    ],
  },
];

function inventoryItem(
  id: number,
  nombre: string,
  clave: string,
  codigo: string,
  base: string,
  sucursal: string | null,
  cantidad: number,
) {
  return {
    id,
    id_producto: id,
    nombre,
    clave,
    marca: 'Genérica',
    codigo_barras: codigo,
    precio_venta: sucursal ?? base,
    precio_sucursal: sucursal,
    precio_base: base,
    costo: '10.00',
    cantidad,
    vigente_desde: null,
  };
}

export const BRANCHES = [
  {
    id: 1,
    nombre_sucursal: 'Centro',
    codigo_sucursal: 'SUC-001',
    ubicacion: 'Av Reforma 123',
    codigo_postal: '06000',
    numero_telefono: '5512345678',
    correo_electronico: 'centro@trt.com',
  },
  {
    id: 2,
    nombre_sucursal: 'Norte',
    codigo_sucursal: 'SUC-002',
    ubicacion: 'Calle Norte 45',
    codigo_postal: '07000',
    numero_telefono: '5598765432',
    correo_electronico: 'norte@trt.com',
  },
];

/** Productos con precio de sucursal (`GET /productos?id_sucursal=…`). */
export const PRODUCTOS_SUCURSAL = [
  productStock(1, 'Balata delantera', 'BAL-001', '100.00', null),
  productStock(4, 'Amortiguador', 'AMO-004', '400.00', '350.00'),
];

function productStock(
  id: number,
  nombre: string,
  clave: string,
  base: string,
  sucursal: string | null,
) {
  return {
    id,
    id_tipo: 1,
    id_proveedor: 1,
    clave,
    nombre,
    descripcion: nombre,
    codigo_barras: `75${id}`,
    precio_venta: sucursal ?? base,
    marca: 'Genérica',
    costo: '10.00',
    codigoSAT: null,
    cantidad: 5,
    precio_sucursal: sucursal,
    precio_base: base,
    vigente_desde: null,
    id_sucursal: SUCURSAL_ID,
  };
}

export const USERS = [
  { id: 1, username: 'admin', email: 'admin@trt.com', is_active: true },
  { id: 2, username: 'ana.centro', email: 'ana@trt.com', is_active: false },
];

/** Respuesta de `POST /ventas/` y ticket de `GET /ventas/:id/ticket/`. */
export const VENTA_CREADA = {
  id: 77,
  id_usuario: 1,
  id_inventario: 1,
  id_metodo_pago: 1,
  total: '100.00',
  fecha: '2026-11-13T10:00:00Z',
};

export const TICKET_77 = {
  folio: 77,
  fecha: '2026-11-13T10:00:00Z',
  vendedor: 'vendedor1',
  metodo_pago: 'Efectivo',
  sucursal: 'Centro',
  productos: [
    { nombre: 'Balata delantera', cantidad: 1, precio_unitario: '100.00', subtotal: '100.00' },
  ],
  total: '100.00',
};
