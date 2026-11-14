import { SaleDate } from './sale-date.value';

describe('SaleDate', () => {
  describe('fromPrimitive', () => {
    // Verifica que una fecha ISO con hora y zona se acepte y se conserve tal cual.
    it('acepta una fecha ISO completa y conserva el string original', () => {
      const date = SaleDate.fromPrimitive('2025-01-15T10:00:00Z', 'Test');
      expect(date.value).toBe('2025-01-15T10:00:00Z');
    });

    // Verifica que una fecha ISO sin hora (solo día) también sea válida.
    it('acepta una fecha ISO solo con día', () => {
      expect(SaleDate.fromPrimitive('2025-01-15', 'Test').value).toBe('2025-01-15');
    });

    // Verifica que un texto no fechable sea rechazado con el mensaje esperado.
    it('rechaza un texto que no es fecha', () => {
      expect(() => SaleDate.fromPrimitive('no-es-fecha', 'Sale.fecha')).toThrow(
        'Sale.fecha: sale date must be an ISO date string',
      );
    });

    // Verifica que el string vacío sea rechazado (el backend podría enviarlo en vez de null).
    it('rechaza el string vacío', () => {
      expect(() => SaleDate.fromPrimitive('', 'Test.ctx')).toThrow(
        'Test.ctx: sale date must be an ISO date string',
      );
    });

    // Verifica que un string solo con espacios sea rechazado.
    it('rechaza un string de solo espacios', () => {
      expect(() => SaleDate.fromPrimitive('   ', 'Test.ctx')).toThrow('Test.ctx');
    });

    // Verifica que un mes fuera de rango (13) sea rechazado.
    it('rechaza un mes inexistente', () => {
      expect(() => SaleDate.fromPrimitive('2025-13-01', 'Test.ctx')).toThrow('Test.ctx');
    });

    // Verifica que una hora fuera de rango (25) sea rechazada.
    it('rechaza una hora inexistente', () => {
      expect(() => SaleDate.fromPrimitive('2025-01-15T25:00:00Z', 'Test.ctx')).toThrow('Test.ctx');
    });

    // Verifica que el mensaje de error incluya el contexto recibido (útil para rastrear el origen).
    it('incluye el contexto en el mensaje de error', () => {
      expect(() => SaleDate.fromPrimitive('x', 'DetailedSale.fecha')).toThrow('DetailedSale.fecha');
    });

    // Verifica que un valor ausente (undefined, p. ej. campo omitido por el backend) no pase como fecha.
    it('rechaza undefined', () => {
      expect(() => SaleDate.fromPrimitive(undefined as unknown as string, 'Test.ctx')).toThrow(
        'Test.ctx: sale date must be an ISO date string',
      );
    });

    // Date.parse usa el parser legacy de V8: acepta basura con números y fechas calendario imposibles.
    it.todo('BUG: SaleDate.fromPrimitive acepta "abc 1" y "12" (Date.parse legacy) aunque el mensaje promete ISO');
    it.todo('BUG: SaleDate.fromPrimitive acepta "2024-02-30" (día inexistente; Date.parse lo desborda a 1-mar)');
  });

  describe('fromNullable', () => {
    // Verifica que null se propague como null sin lanzar (venta sin fecha).
    it('devuelve null cuando el valor es null', () => {
      expect(SaleDate.fromNullable(null, 'Test')).toBeNull();
    });

    // Verifica que un valor válido se convierta en SaleDate.
    it('devuelve un SaleDate cuando el valor es válido', () => {
      const date = SaleDate.fromNullable('2025-01-15T10:00:00Z', 'Test');
      expect(date).toBeInstanceOf(SaleDate);
      expect(date?.value).toBe('2025-01-15T10:00:00Z');
    });

    // Verifica que un valor no nulo pero inválido siga siendo rechazado.
    it('rechaza un valor no nulo e inválido', () => {
      expect(() => SaleDate.fromNullable('basura', 'Sale.fecha')).toThrow(
        'Sale.fecha: sale date must be an ISO date string',
      );
    });

    // Verifica que el string vacío NO se trate como null: lanza en vez de devolver null.
    it('rechaza el string vacío en lugar de tratarlo como null', () => {
      expect(() => SaleDate.fromNullable('', 'Sale.fecha')).toThrow('Sale.fecha');
    });
  });
});
