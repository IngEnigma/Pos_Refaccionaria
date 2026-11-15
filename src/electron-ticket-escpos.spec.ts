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
  subtotal: '200.00',
  iva: '32.00',
  total: '232.00',
};

describe('ticket-escpos', () => {
  // El desglose viene del backend: subtotal + IVA 16 % = total.
  it('muestra subtotal e IVA 16 % en la vista previa', () => {
    const preview = generatePreview(ticket);
    expect(preview).toContain('Subtotal: $200.00');
    expect(preview).toContain('IVA 16%: $32.00');
    expect(preview).toContain('TOTAL: $232.00');
  });

  // H-40: el buffer ESC/POS imprime el mismo desglose.
  it('imprime subtotal e IVA en el buffer ESC/POS', () => {
    const text = generateTicket(ticket).toString('latin1');
    expect(text).toContain('Subtotal: $200.00');
    expect(text).toContain('IVA 16%: $32.00');
    expect(text).toContain('TOTAL $232.00');
  });

  // H-17: los datos vienen del backend; un nombre con ESC/GS no debe inyectar comandos a la impresora.
  it('H-17: filtra caracteres de control del texto antes de ESC/POS', () => {
    const hostil = { ...ticket, productos: [{ ...ticket.productos[0], nombre: 'Ba\x1B@\x1D\x56\x00lata\tX' }] };
    const buffer: Buffer = generateTicket(hostil);
    const text = buffer.toString('latin1');
    expect(text).toContain('2x Ba@VlataX');
    // Solo quedan los comandos propios (ESC @ inicial, GS V final), no los inyectados.
    expect(buffer.indexOf(Buffer.from([0x1d, 0x56, 0x00]))).toBe(buffer.length - 3);
    expect(text.split('\x1B@').length - 1).toBe(1);
  });
});
