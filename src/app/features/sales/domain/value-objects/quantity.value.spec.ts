import { Quantity } from './quantity.value';

describe('Quantity', () => {
  // Verifica que las cantidades positivas sean aceptadas.
  it('acepta cantidades positivas', () => {
    expect(Quantity.fromNumber(1, 'Test').value).toBe(1);
  });

  // Verifica que la cantidad cero sea rechazada (toda línea de venta requiere al menos 1).
  it('rechaza cero', () => {
    expect(() => Quantity.fromNumber(0, 'Test.ctx')).toThrow(
      'Test.ctx: quantity must be greater than zero',
    );
  });

  // Verifica que las cantidades negativas sean rechazadas.
  it('rechaza valores negativos', () => {
    expect(() => Quantity.fromNumber(-3, 'Test.ctx')).toThrow(
      'Test.ctx: quantity must be greater than zero',
    );
  });

  // Verifica que NaN sea rechazado como cantidad inválida.
  it('rechaza NaN', () => {
    expect(() => Quantity.fromNumber(NaN, 'Test.ctx')).toThrow(
      'Test.ctx: quantity must be greater than zero',
    );
  });

  // Verifica que Infinity sea rechazado como cantidad inválida.
  it('rechaza Infinity', () => {
    expect(() => Quantity.fromNumber(Infinity, 'Test.ctx')).toThrow(
      'Test.ctx: quantity must be greater than zero',
    );
  });

  // Verifica que el mensaje de error incluya el contexto recibido (útil para rastrear el origen).
  it('incluye el contexto en el mensaje de error', () => {
    expect(() => Quantity.fromNumber(0, 'OrderItem.quantity')).toThrow('OrderItem.quantity');
  });
});
