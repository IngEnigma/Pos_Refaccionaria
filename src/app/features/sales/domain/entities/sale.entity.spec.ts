import { Sale, SaleFactory, SaleProps } from './sale.entity';
import { Money } from '../value-objects/money.value';
import { SaleDate } from '../value-objects/sale-date.value';

describe('Sale', () => {
  const baseProps: SaleProps = {
    id: 10,
    idUsuario: 3,
    idSucursal: 7,
    idMetodoPago: 2,
    total: 139.2,
    fecha: '2025-01-15T10:00:00Z',
  };

  // Verifica que el constructor copie los ids y envuelva total y fecha en sus value objects.
  it('construye la venta con ids, total como Money y fecha como SaleDate', () => {
    const sale = new Sale(baseProps);

    expect(sale.id).toBe(10);
    expect(sale.idUsuario).toBe(3);
    expect(sale.idSucursal).toBe(7);
    expect(sale.idMetodoPago).toBe(2);
    expect(sale.total).toBeInstanceOf(Money);
    expect(sale.total.value).toBe(139.2);
    expect(sale.fecha).toBeInstanceOf(SaleDate);
    expect(sale.fecha?.value).toBe('2025-01-15T10:00:00Z');
  });

  // Verifica que los ids opcionales (usuario, sucursal, método de pago) acepten null.
  it('acepta ids nulos', () => {
    const sale = new Sale({ ...baseProps, idUsuario: null, idSucursal: null, idMetodoPago: null });

    expect(sale.idUsuario).toBeNull();
    expect(sale.idSucursal).toBeNull();
    expect(sale.idMetodoPago).toBeNull();
  });

  // Verifica que una fecha nula se conserve como null en vez de lanzar.
  it('acepta fecha nula', () => {
    expect(new Sale({ ...baseProps, fecha: null }).fecha).toBeNull();
  });

  // Verifica que un total cero sea válido (venta sin importe).
  it('acepta total cero', () => {
    expect(new Sale({ ...baseProps, total: 0 }).total.value).toBe(0);
  });

  // Verifica que los centavos del total se conserven sin redondeo.
  it('conserva los decimales del total', () => {
    expect(new Sale({ ...baseProps, total: 19.99 }).total.value).toBe(19.99);
  });

  // Verifica que un total negativo sea rechazado con el contexto Sale.total.
  it('rechaza total negativo', () => {
    expect(() => new Sale({ ...baseProps, total: -0.01 })).toThrow(
      'Sale.total: money must be a non-negative number',
    );
  });

  // Verifica que un total NaN (p. ej. Number("abc") previo) sea rechazado.
  it('rechaza total NaN', () => {
    expect(() => new Sale({ ...baseProps, total: NaN })).toThrow(
      'Sale.total: money must be a non-negative number',
    );
  });

  // Verifica que un total infinito sea rechazado.
  it('rechaza total Infinity', () => {
    expect(() => new Sale({ ...baseProps, total: Infinity })).toThrow('Sale.total');
  });

  // Verifica que una fecha inválida sea rechazada con el contexto Sale.fecha.
  it('rechaza fecha inválida', () => {
    expect(() => new Sale({ ...baseProps, fecha: 'ayer' })).toThrow(
      'Sale.fecha: sale date must be an ISO date string',
    );
  });
});

describe('SaleFactory', () => {
  // Verifica que fromPrimitives devuelva una instancia de Sale con los datos recibidos.
  it('fromPrimitives crea una Sale con los datos recibidos', () => {
    const sale = SaleFactory.fromPrimitives({
      id: 1,
      idUsuario: null,
      idSucursal: null,
      idMetodoPago: 5,
      total: 50,
      fecha: null,
    });

    expect(sale).toBeInstanceOf(Sale);
    expect(sale.id).toBe(1);
    expect(sale.idMetodoPago).toBe(5);
    expect(sale.total.value).toBe(50);
    expect(sale.fecha).toBeNull();
  });

  // Verifica que fromPrimitives propague las validaciones del constructor.
  it('fromPrimitives propaga el error de total inválido', () => {
    expect(() =>
      SaleFactory.fromPrimitives({
        id: 1,
        idUsuario: null,
        idSucursal: null,
        idMetodoPago: null,
        total: -5,
        fecha: null,
      }),
    ).toThrow('Sale.total: money must be a non-negative number');
  });
});
