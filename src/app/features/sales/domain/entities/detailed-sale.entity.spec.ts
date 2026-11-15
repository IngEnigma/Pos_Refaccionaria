import { DetailedSale, DetailedSaleItem, DetailedSaleProps } from './detailed-sale.entity';
import { Money } from '../value-objects/money.value';
import { Quantity } from '../value-objects/quantity.value';
import { SaleDate } from '../value-objects/sale-date.value';

describe('DetailedSale', () => {
  const item: DetailedSaleItem = {
    id: 1,
    producto: {
      id: 9,
      nombre: 'Balata delantera',
      precioVenta: Money.fromNumber(120, 'test'),
      codigoBarras: '750100',
    },
    cantidad: Quantity.fromNumber(2, 'test'),
    subtotal: Money.fromNumber(240, 'test'),
  };

  const baseProps: DetailedSaleProps = {
    id: 55,
    idInventario: 4,
    fecha: '2025-01-15T10:00:00Z',
    subtotal: 240,
    iva: 38.4,
    total: 278.4,
    detalles: [item],
  };

  // Verifica que el constructor copie id e inventario y envuelva fecha y total en sus value objects.
  it('construye la venta con fecha como SaleDate y total como Money', () => {
    const sale = new DetailedSale(baseProps);

    expect(sale.id).toBe(55);
    expect(sale.idInventario).toBe(4);
    expect(sale.fecha).toBeInstanceOf(SaleDate);
    expect(sale.fecha.value).toBe('2025-01-15T10:00:00Z');
    expect(sale.total).toBeInstanceOf(Money);
    expect(sale.total.value).toBe(278.4);
  });

  // Verifica que los detalles se conserven tal cual (misma referencia y contenido).
  it('conserva los detalles recibidos', () => {
    const sale = new DetailedSale(baseProps);

    expect(sale.detalles).toBe(baseProps.detalles);
    expect(sale.detalles[0].producto.nombre).toBe('Balata delantera');
    expect(sale.detalles[0].cantidad.value).toBe(2);
    expect(sale.detalles[0].subtotal.value).toBe(240);
  });

  // Verifica que idInventario acepte null (venta reconstruida desde ticket).
  it('acepta idInventario nulo', () => {
    expect(new DetailedSale({ ...baseProps, idInventario: null }).idInventario).toBeNull();
  });

  // Verifica que una lista de detalles vacía sea aceptada.
  it('acepta detalles vacíos', () => {
    expect(new DetailedSale({ ...baseProps, detalles: [] }).detalles).toEqual([]);
  });

  // Verifica que un total cero sea válido.
  it('acepta total cero', () => {
    expect(new DetailedSale({ ...baseProps, total: 0 }).total.value).toBe(0);
  });

  // Verifica que un total negativo sea rechazado con el contexto DetailedSale.total.
  it('rechaza total negativo', () => {
    expect(() => new DetailedSale({ ...baseProps, total: -10 })).toThrow(
      'DetailedSale.total: money must be a non-negative number',
    );
  });

  // Verifica que un total NaN sea rechazado.
  it('rechaza total NaN', () => {
    expect(() => new DetailedSale({ ...baseProps, total: NaN })).toThrow('DetailedSale.total');
  });

  // Verifica que una fecha inválida sea rechazada con el contexto DetailedSale.fecha.
  it('rechaza fecha inválida', () => {
    expect(() => new DetailedSale({ ...baseProps, fecha: 'no-fecha' })).toThrow(
      'DetailedSale.fecha: sale date must be an ISO date string',
    );
  });

  // Verifica que la fecha sea obligatoria: null no está permitido en DetailedSale.
  it('rechaza fecha nula', () => {
    expect(() => new DetailedSale({ ...baseProps, fecha: null as unknown as string })).toThrow(
      'DetailedSale.fecha',
    );
  });
});
