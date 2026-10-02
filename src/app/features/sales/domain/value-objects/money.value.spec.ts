import { Money } from './money.value';

describe('Money', () => {
  // Verifica que el valor cero sea aceptado como monto válido.
  it('acepta cero', () => {
    expect(Money.fromNumber(0, 'Test').value).toBe(0);
  });

  // Verifica que se acepten montos positivos, incluyendo decimales (centavos).
  it('acepta valores positivos y decimales', () => {
    expect(Money.fromNumber(99.5, 'Test').value).toBe(99.5);
  });

  // Verifica que los montos negativos sean rechazados con el mensaje esperado.
  it('rechaza valores negativos', () => {
    expect(() => Money.fromNumber(-1, 'Test.ctx')).toThrow(
      'Test.ctx: money must be a non-negative number',
    );
  });

  // Verifica que NaN sea rechazado como monto inválido.
  it('rechaza NaN', () => {
    expect(() => Money.fromNumber(NaN, 'Test.ctx')).toThrow(
      'Test.ctx: money must be a non-negative number',
    );
  });

  // Verifica que Infinity sea rechazado como monto inválido.
  it('rechaza Infinity', () => {
    expect(() => Money.fromNumber(Infinity, 'Test.ctx')).toThrow(
      'Test.ctx: money must be a non-negative number',
    );
  });

  // Verifica que el mensaje de error incluya el contexto recibido (útil para rastrear el origen).
  it('incluye el contexto en el mensaje de error', () => {
    expect(() => Money.fromNumber(-10, 'Sale.total')).toThrow('Sale.total');
  });
});
