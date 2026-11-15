import { DetailedSale, DetailedSaleItem } from '../../domain/entities/detailed-sale.entity';
import { SaleTicketDto } from '../dtos/sale-ticket.dto';
import { Money } from '../../domain/value-objects/money.value';
import { Quantity } from '../../domain/value-objects/quantity.value';

export class DetailedSaleMapper {
  static fromTicket(dto: SaleTicketDto): DetailedSale {
    const detalles: DetailedSaleItem[] = dto.productos.map((p, idx) => ({
      id: idx + 1,
      producto: {
        id: 0,
        nombre: p.nombre,
        precioVenta: Money.fromNumber(Number(p.precio_unitario), 'Product.precioVenta'),
        codigoBarras: '',
      },
      cantidad: Quantity.fromNumber(p.cantidad, 'SaleDetail.cantidad'),
      subtotal: Money.fromNumber(Number(p.subtotal), 'SaleDetail.subtotal'),
    }));

    return new DetailedSale({
      id: dto.folio,
      idInventario: null,
      fecha: dto.fecha ?? new Date().toISOString(),
      subtotal: Number(dto.subtotal),
      iva: Number(dto.iva),
      total: Number(dto.total),
      detalles,
    });
  }
}
