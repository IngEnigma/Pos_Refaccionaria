import { DetailedSaleMapper } from './detailed-sale.mapper';
import { DetailedSale } from '../../domain/entities/detailed-sale.entity';
import { DetailedSaleDTO } from '../dtos/detailed-sale.dto';
import { SaleTicketDto } from '../dtos/sale-ticket.dto';

describe('DetailedSaleMapper', () => {
  const dto: DetailedSaleDTO = {
    id: 55,
    id_inventario: 4,
    fecha: '2025-01-15T10:00:00Z',
    total: '278.40',
    detalles: [
      {
        id: 1,
        producto: { id: 9, nombre: 'Balata delantera', precio_venta: '120.00', codigo_barras: '750100' },
        cantidad: 2,
        subtotal: '240.00',
      },
      {
        id: 2,
        producto: { id: 10, nombre: 'Filtro de aceite', precio_venta: '19.99', codigo_barras: '750200' },
        cantidad: 1,
        subtotal: '19.99',
      },
    ],
  };

  describe('toDomain', () => {
    // Verifica que los datos de cabecera del DTO se mapeen a la entidad DetailedSale.
    it('mapea la cabecera a una entidad DetailedSale', () => {
      const sale = DetailedSaleMapper.toDomain(dto);

      expect(sale).toBeInstanceOf(DetailedSale);
      expect(sale.id).toBe(55);
      expect(sale.idInventario).toBe(4);
      expect(sale.fecha.value).toBe('2025-01-15T10:00:00Z');
    });

    // Verifica que el total string se convierta a Money numérico.
    it('convierte el total string a número', () => {
      expect(DetailedSaleMapper.toDomain(dto).total.value).toBe(278.4);
    });

    // Verifica que cada detalle convierta precios y subtotales string a Money y la cantidad a Quantity.
    it('mapea cada detalle con montos numéricos y cantidad', () => {
      const [first, second] = DetailedSaleMapper.toDomain(dto).detalles;

      expect(first.id).toBe(1);
      expect(first.producto).toEqual({
        id: 9,
        nombre: 'Balata delantera',
        precioVenta: expect.objectContaining({ value: 120 }),
        codigoBarras: '750100',
      });
      expect(first.cantidad.value).toBe(2);
      expect(first.subtotal.value).toBe(240);
      expect(second.producto.precioVenta.value).toBe(19.99);
      expect(second.subtotal.value).toBe(19.99);
    });

    // Verifica que el orden de los detalles se conserve.
    it('conserva el orden de los detalles', () => {
      expect(DetailedSaleMapper.toDomain(dto).detalles.map((d) => d.producto.nombre)).toEqual([
        'Balata delantera',
        'Filtro de aceite',
      ]);
    });

    // Verifica que id_inventario nulo se conserve como null.
    it('conserva id_inventario nulo', () => {
      expect(DetailedSaleMapper.toDomain({ ...dto, id_inventario: null }).idInventario).toBeNull();
    });

    // Verifica que una venta sin detalles produzca lista vacía.
    it('mapea detalles vacíos a lista vacía', () => {
      expect(DetailedSaleMapper.toDomain({ ...dto, detalles: [], total: '0.00' }).detalles).toEqual([]);
    });

    // Verifica que una cantidad decimal sea aceptada.
    it('acepta cantidad decimal en un detalle', () => {
      const sale = DetailedSaleMapper.toDomain({
        ...dto,
        detalles: [{ ...dto.detalles[0], cantidad: 1.5 }],
      });

      expect(sale.detalles[0].cantidad.value).toBe(1.5);
    });

    // Verifica que un total no numérico sea rechazado con el contexto DetailedSale.total.
    it('rechaza total no numérico', () => {
      expect(() => DetailedSaleMapper.toDomain({ ...dto, total: 'abc' })).toThrow(
        'DetailedSale.total: money must be a non-negative number',
      );
    });

    // Verifica que una fecha inválida sea rechazada con el contexto DetailedSale.fecha.
    it('rechaza fecha inválida', () => {
      expect(() => DetailedSaleMapper.toDomain({ ...dto, fecha: 'no-fecha' })).toThrow(
        'DetailedSale.fecha: sale date must be an ISO date string',
      );
    });

    // Verifica que un precio de venta inválido en un detalle sea rechazado con su contexto.
    it('rechaza precio_venta no numérico en un detalle', () => {
      const bad: DetailedSaleDTO = {
        ...dto,
        detalles: [{ ...dto.detalles[0], producto: { ...dto.detalles[0].producto, precio_venta: 'x' } }],
      };

      expect(() => DetailedSaleMapper.toDomain(bad)).toThrow('Product.precioVenta: money must be a non-negative number');
    });

    // Verifica que un subtotal negativo en un detalle sea rechazado con su contexto.
    it('rechaza subtotal negativo en un detalle', () => {
      const bad: DetailedSaleDTO = { ...dto, detalles: [{ ...dto.detalles[0], subtotal: '-1' }] };

      expect(() => DetailedSaleMapper.toDomain(bad)).toThrow('SaleDetail.subtotal: money must be a non-negative number');
    });

    // Verifica que una cantidad cero en un detalle sea rechazada con su contexto.
    it('rechaza cantidad cero en un detalle', () => {
      const bad: DetailedSaleDTO = { ...dto, detalles: [{ ...dto.detalles[0], cantidad: 0 }] };

      expect(() => DetailedSaleMapper.toDomain(bad)).toThrow(
        'SaleDetail.cantidad: quantity must be greater than zero',
      );
    });
  });

  describe('fromTicket', () => {
    const ticket: SaleTicketDto = {
      folio: 1001,
      fecha: '2025-01-15T10:00:00Z',
      vendedor: 'cajero1',
      metodo_pago: 'Efectivo',
      sucursal: 'Centro',
      productos: [
        { nombre: 'Balata', cantidad: 2, precio_unitario: '120.00', subtotal: '240.00' },
        { nombre: 'Filtro', cantidad: 1, precio_unitario: '35.50', subtotal: '35.50' },
      ],
      total: '275.50',
    };

    afterEach(() => {
      jest.useRealTimers();
    });

    // Verifica que el folio pase a ser el id y que no haya inventario (el ticket no lo trae).
    it('usa el folio como id y deja idInventario en null', () => {
      const sale = DetailedSaleMapper.fromTicket(ticket);

      expect(sale).toBeInstanceOf(DetailedSale);
      expect(sale.id).toBe(1001);
      expect(sale.idInventario).toBeNull();
    });

    // Verifica que fecha y total string del ticket se conviertan a SaleDate y Money.
    it('convierte fecha y total del ticket', () => {
      const sale = DetailedSaleMapper.fromTicket(ticket);

      expect(sale.fecha.value).toBe('2025-01-15T10:00:00Z');
      expect(sale.total.value).toBe(275.5);
    });

    // Verifica que los productos reciban ids secuenciales desde 1, producto.id 0 y código de barras vacío.
    it('asigna ids secuenciales y valores por defecto a los productos', () => {
      const [first, second] = DetailedSaleMapper.fromTicket(ticket).detalles;

      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
      expect(first.producto.id).toBe(0);
      expect(first.producto.codigoBarras).toBe('');
    });

    // Verifica que nombre, precio, cantidad y subtotal del producto se mapeen con montos numéricos.
    it('mapea nombre, precio unitario, cantidad y subtotal', () => {
      const [first, second] = DetailedSaleMapper.fromTicket(ticket).detalles;

      expect(first.producto.nombre).toBe('Balata');
      expect(first.producto.precioVenta.value).toBe(120);
      expect(first.cantidad.value).toBe(2);
      expect(first.subtotal.value).toBe(240);
      expect(second.producto.precioVenta.value).toBe(35.5);
      expect(second.subtotal.value).toBe(35.5);
    });

    // Verifica que si el ticket no trae fecha se use la fecha actual en ISO.
    it('usa la fecha actual cuando el ticket no trae fecha', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-03-10T12:30:00.000Z'));

      const sale = DetailedSaleMapper.fromTicket({ ...ticket, fecha: null });

      expect(sale.fecha.value).toBe('2025-03-10T12:30:00.000Z');
    });

    // Verifica que un ticket sin productos produzca detalles vacíos.
    it('mapea productos vacíos a detalles vacíos', () => {
      expect(DetailedSaleMapper.fromTicket({ ...ticket, productos: [], total: '0.00' }).detalles).toEqual([]);
    });

    // Verifica que un total inválido del ticket sea rechazado.
    it('rechaza total no numérico', () => {
      expect(() => DetailedSaleMapper.fromTicket({ ...ticket, total: 'abc' })).toThrow('DetailedSale.total');
    });

    // Verifica que un precio unitario inválido sea rechazado con el contexto Product.precioVenta.
    it('rechaza precio_unitario no numérico', () => {
      const bad: SaleTicketDto = {
        ...ticket,
        productos: [{ nombre: 'X', cantidad: 1, precio_unitario: 'x', subtotal: '1' }],
      };

      expect(() => DetailedSaleMapper.fromTicket(bad)).toThrow('Product.precioVenta');
    });

    // Verifica que una cantidad cero en el ticket sea rechazada.
    it('rechaza cantidad cero en un producto', () => {
      const bad: SaleTicketDto = {
        ...ticket,
        productos: [{ nombre: 'X', cantidad: 0, precio_unitario: '1', subtotal: '0' }],
      };

      expect(() => DetailedSaleMapper.fromTicket(bad)).toThrow('SaleDetail.cantidad');
    });
  });
});
