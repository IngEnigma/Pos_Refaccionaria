import { SaleTicket, SaleTicketProps } from './sale-ticket.entity';

describe('SaleTicket', () => {
  const baseProps: SaleTicketProps = {
    folio: 1001,
    fecha: '2025-01-15T10:00:00Z',
    vendedor: 'cajero1',
    metodoPago: 'Efectivo',
    sucursal: 'Centro',
    productos: [
      { nombre: 'Balata', cantidad: 2, precioUnitario: '120.00', subtotal: '240.00' },
      { nombre: 'Filtro', cantidad: 1, precioUnitario: '35.50', subtotal: '35.50' },
    ],
    total: '275.50',
  };

  // Verifica que todos los campos del ticket se asignen sin transformación.
  it('asigna todos los campos recibidos', () => {
    const ticket = new SaleTicket(baseProps);

    expect(ticket.folio).toBe(1001);
    expect(ticket.fecha).toBe('2025-01-15T10:00:00Z');
    expect(ticket.vendedor).toBe('cajero1');
    expect(ticket.metodoPago).toBe('Efectivo');
    expect(ticket.sucursal).toBe('Centro');
    expect(ticket.total).toBe('275.50');
  });

  // Verifica que los montos del ticket se conserven como string (formato ya listo para imprimir).
  it('conserva los montos como string sin reformatear', () => {
    const ticket = new SaleTicket(baseProps);

    expect(ticket.productos[0].precioUnitario).toBe('120.00');
    expect(ticket.productos[0].subtotal).toBe('240.00');
    expect(typeof ticket.total).toBe('string');
  });

  // Verifica que los productos conserven orden y cantidad.
  it('conserva los productos en el mismo orden', () => {
    const ticket = new SaleTicket(baseProps);

    expect(ticket.productos).toHaveLength(2);
    expect(ticket.productos.map((p) => p.nombre)).toEqual(['Balata', 'Filtro']);
    expect(ticket.productos[0].cantidad).toBe(2);
  });

  // Verifica que fecha, vendedor, método de pago y sucursal acepten null.
  it('acepta campos opcionales nulos', () => {
    const ticket = new SaleTicket({
      ...baseProps,
      fecha: null,
      vendedor: null,
      metodoPago: null,
      sucursal: null,
    });

    expect(ticket.fecha).toBeNull();
    expect(ticket.vendedor).toBeNull();
    expect(ticket.metodoPago).toBeNull();
    expect(ticket.sucursal).toBeNull();
  });

  // Verifica que un ticket sin productos sea aceptado.
  it('acepta lista de productos vacía', () => {
    expect(new SaleTicket({ ...baseProps, productos: [], total: '0.00' }).productos).toEqual([]);
  });
});
