// Prueba el generador de tickets del proceso principal de Electron (CommonJS, fuera de src/app).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateTicket, generatePreview } = require('../electron/printer/ticket-escpos');

const ticket = {
  folio: 77,
  fecha: '2024-01-01T10:00:00Z',
  vendedor: 'Ana',
  metodo_pago: 'EFECTIVO',
  sucursal: 'Centro',
  productos: [{ nombre: 'Balata', cantidad: 2, subtotal: '200.00', precio_unitario: '100.00' }],
  total: '200.00',
};

describe('ticket-escpos', () => {
  // H-40: el precio ya incluye IVA; el ticket desglosa subtotal e IVA incluido a partir del total.
  it('muestra subtotal e IVA 16 % incluido en la vista previa', () => {
    const preview = generatePreview(ticket);
    expect(preview).toContain('Subtotal: $172.41');
    expect(preview).toContain('IVA 16% incluido: $27.59');
    expect(preview).toContain('TOTAL: $200.00');
  });

  // H-40: el buffer ESC/POS imprime el mismo desglose.
  it('imprime subtotal e IVA incluido en el buffer ESC/POS', () => {
    const text = generateTicket(ticket).toString('latin1');
    expect(text).toContain('Subtotal: $172.41');
    expect(text).toContain('IVA 16% incluido: $27.59');
    expect(text).toContain('TOTAL $200.00');
  });
});
