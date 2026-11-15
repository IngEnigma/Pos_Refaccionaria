import { DetailedSaleMapper } from './detailed-sale.mapper';
import { DetailedSale } from '../../domain/entities/detailed-sale.entity';
import { SaleTicketDto } from '../dtos/sale-ticket.dto';

describe('DetailedSaleMapper', () => {
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
      subtotal: '275.50',
      iva: '44.08',
      total: '319.58',
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

    // Verifica que fecha y montos string del ticket se conviertan a SaleDate y Money.
    it('convierte fecha, subtotal, IVA y total del ticket', () => {
      const sale = DetailedSaleMapper.fromTicket(ticket);

      expect(sale.fecha.value).toBe('2025-01-15T10:00:00Z');
      expect(sale.subtotal.value).toBe(275.5);
      expect(sale.iva.value).toBe(44.08);
      expect(sale.total.value).toBe(319.58);
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
