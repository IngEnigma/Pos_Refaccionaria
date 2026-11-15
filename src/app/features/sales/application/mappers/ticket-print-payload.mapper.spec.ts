import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { toTicketPrintPayload } from './ticket-print-payload.mapper';

describe('toTicketPrintPayload', () => {
  const ticket = new SaleTicket({
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedora',
    metodoPago: 'EFECTIVO',
    sucursal: 'Central',
    productos: [
      { nombre: 'Filtro', cantidad: 2, precioUnitario: '120.00', subtotal: '240.00' },
      { nombre: 'Bujía', cantidad: 1, precioUnitario: '35.50', subtotal: '35.50' },
    ],
    subtotal: '275.50',
    iva: '44.08',
    total: '319.58',
  });

  // Verifica que el payload use las claves snake_case que espera Electron.
  it('mapea encabezado a snake_case', () => {
    const payload = toTicketPrintPayload(ticket);

    expect(payload).toMatchObject({
      folio: 50,
      fecha: '2024-01-01T00:00:00Z',
      vendedor: 'vendedora',
      metodo_pago: 'EFECTIVO',
      sucursal: 'Central',
      subtotal: '275.50',
      iva: '44.08',
      total: '319.58',
    });
    expect(payload).not.toHaveProperty('metodoPago');
  });

  // Verifica que cada producto conserve nombre, cantidad, subtotal y precio_unitario.
  it('mapea cada producto con precio_unitario', () => {
    const { productos } = toTicketPrintPayload(ticket);

    expect(productos).toEqual([
      { nombre: 'Filtro', cantidad: 2, subtotal: '240.00', precio_unitario: '120.00' },
      { nombre: 'Bujía', cantidad: 1, subtotal: '35.50', precio_unitario: '35.50' },
    ]);
  });

  // Verifica que los campos nulos del ticket pasen tal cual (sin inventar valores).
  it('conserva nulos de fecha, vendedor, método de pago y sucursal', () => {
    const empty = new SaleTicket({
      folio: 1, fecha: null, vendedor: null, metodoPago: null, sucursal: null, productos: [], subtotal: '0.00', iva: '0.00', total: '0.00',
    });

    const payload = toTicketPrintPayload(empty);

    expect(payload.fecha).toBeNull();
    expect(payload.vendedor).toBeNull();
    expect(payload.metodo_pago).toBeNull();
    expect(payload.sucursal).toBeNull();
    expect(payload.productos).toEqual([]);
  });
});
