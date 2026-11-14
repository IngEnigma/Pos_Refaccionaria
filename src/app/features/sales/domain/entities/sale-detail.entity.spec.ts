import { SaleDetail, SaleDetailFactory } from './sale-detail.entity';

describe('SaleDetailFactory', () => {
  const valid: SaleDetail = { id: 1, productId: 20, saleId: 30, subtotal: 240, cantidad: 2 };

  // Verifica que un detalle válido se devuelva con los mismos valores.
  it('fromPrimitives devuelve el detalle con los mismos datos', () => {
    expect(SaleDetailFactory.fromPrimitives(valid)).toEqual(valid);
  });

  // Verifica que se devuelva una copia y no la misma referencia del objeto de entrada.
  it('fromPrimitives devuelve una copia, no la misma referencia', () => {
    const result = SaleDetailFactory.fromPrimitives(valid);

    expect(result).not.toBe(valid);
  });

  // Verifica que modificar el original después no afecte la copia devuelta.
  it('la copia no se ve afectada por mutaciones posteriores del original', () => {
    const input = { ...valid };
    const result = SaleDetailFactory.fromPrimitives(input);

    input.subtotal = 999;

    expect(result.subtotal).toBe(240);
  });

  // Verifica que un subtotal cero sea válido.
  it('acepta subtotal cero', () => {
    expect(SaleDetailFactory.fromPrimitives({ ...valid, subtotal: 0 }).subtotal).toBe(0);
  });

  // Verifica que subtotal con centavos y cantidad fraccionaria se conserven.
  it('acepta subtotal con centavos y cantidad decimal', () => {
    const result = SaleDetailFactory.fromPrimitives({ ...valid, subtotal: 59.97, cantidad: 1.5 });

    expect(result.subtotal).toBe(59.97);
    expect(result.cantidad).toBe(1.5);
  });

  // Verifica que un subtotal negativo sea rechazado con el contexto SaleDetail.subtotal.
  it('rechaza subtotal negativo', () => {
    expect(() => SaleDetailFactory.fromPrimitives({ ...valid, subtotal: -1 })).toThrow(
      'SaleDetail.subtotal: money must be a non-negative number',
    );
  });

  // Verifica que un subtotal NaN sea rechazado.
  it('rechaza subtotal NaN', () => {
    expect(() => SaleDetailFactory.fromPrimitives({ ...valid, subtotal: NaN })).toThrow(
      'SaleDetail.subtotal',
    );
  });

  // Verifica que una cantidad cero sea rechazada con el contexto SaleDetail.cantidad.
  it('rechaza cantidad cero', () => {
    expect(() => SaleDetailFactory.fromPrimitives({ ...valid, cantidad: 0 })).toThrow(
      'SaleDetail.cantidad: quantity must be greater than zero',
    );
  });

  // Verifica que una cantidad negativa sea rechazada.
  it('rechaza cantidad negativa', () => {
    expect(() => SaleDetailFactory.fromPrimitives({ ...valid, cantidad: -3 })).toThrow(
      'SaleDetail.cantidad: quantity must be greater than zero',
    );
  });

  // Verifica que una cantidad infinita sea rechazada.
  it('rechaza cantidad Infinity', () => {
    expect(() => SaleDetailFactory.fromPrimitives({ ...valid, cantidad: Infinity })).toThrow(
      'SaleDetail.cantidad',
    );
  });
});
