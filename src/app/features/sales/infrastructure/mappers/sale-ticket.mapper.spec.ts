import { SaleTicketMapper } from './sale-ticket.mapper';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { SaleTicketDto } from '@features/sales/infrastructure/dtos/sale-ticket.dto';

describe('SaleTicketMapper', () => {
  const dto: SaleTicketDto = {
    folio: 1001,
    fecha: '2025-01-15T10:00:00Z',
    vendedor: 'cajero1',
    metodo_pago: 'Efectivo',
    sucursal: 'Centro',
    productos: [
      { nombre: 'Balata', cantidad: 2, precio_unitario: '120.00', subtotal: '240.00' },
      { nombre: 'Filtro', cantidad: 1, precio_unitario: '35.50', subtotal: '35.50' },
    ],
    subtotal: '237.50',
    iva: '38.00',
    total: '275.50',
  };

  describe('fromResponseDto', () => {
    // Verifica que el DTO snake_case se mapee a la entidad SaleTicket en camelCase.
    it('mapea el DTO a una entidad SaleTicket', () => {
      const ticket = SaleTicketMapper.fromResponseDto(dto);

      expect(ticket).toBeInstanceOf(SaleTicket);
      expect(ticket.folio).toBe(1001);
      expect(ticket.fecha).toBe('2025-01-15T10:00:00Z');
      expect(ticket.vendedor).toBe('cajero1');
      expect(ticket.metodoPago).toBe('Efectivo');
      expect(ticket.sucursal).toBe('Centro');
      expect(ticket.subtotal).toBe('237.50');
      expect(ticket.iva).toBe('38.00');
      expect(ticket.total).toBe('275.50');
    });

    // Verifica que cada producto convierta precio_unitario a precioUnitario conservando los strings.
    it('mapea los productos a camelCase conservando los montos como string', () => {
      const ticket = SaleTicketMapper.fromResponseDto(dto);

      expect(ticket.productos).toEqual([
        { nombre: 'Balata', cantidad: 2, precioUnitario: '120.00', subtotal: '240.00' },
        { nombre: 'Filtro', cantidad: 1, precioUnitario: '35.50', subtotal: '35.50' },
      ]);
    });

    // Verifica que no se reformateen los montos (el backend ya los envía listos para imprimir).
    it('no reformatea los montos string', () => {
      const ticket = SaleTicketMapper.fromResponseDto({
        ...dto,
        productos: [{ nombre: 'X', cantidad: 1, precio_unitario: '10', subtotal: '10' }],
        total: '10',
      });

      expect(ticket.productos[0].precioUnitario).toBe('10');
      expect(ticket.total).toBe('10');
    });

    // Verifica que los campos opcionales nulos del backend se conserven como null.
    it('conserva fecha, vendedor, método de pago y sucursal nulos', () => {
      const ticket = SaleTicketMapper.fromResponseDto({
        ...dto,
        fecha: null,
        vendedor: null,
        metodo_pago: null,
        sucursal: null,
      });

      expect(ticket.fecha).toBeNull();
      expect(ticket.vendedor).toBeNull();
      expect(ticket.metodoPago).toBeNull();
      expect(ticket.sucursal).toBeNull();
    });

    // Verifica que un ticket sin productos produzca lista vacía.
    it('mapea productos vacíos a lista vacía', () => {
      expect(SaleTicketMapper.fromResponseDto({ ...dto, productos: [], total: '0.00' }).productos).toEqual([]);
    });

    // Verifica que los productos mapeados sean objetos nuevos, no las referencias del DTO.
    it('no reutiliza los objetos de producto del DTO', () => {
      const ticket = SaleTicketMapper.fromResponseDto(dto);

      expect(ticket.productos[0]).not.toBe(dto.productos[0]);
    });
  });
});
