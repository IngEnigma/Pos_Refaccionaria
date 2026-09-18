import { DetailedSale, DetailedSaleItem } from '../../domain/entities/detailed-sale.entity';
import { DetailedSaleDTO } from '../dtos/detailed-sale.dto';
import { SaleTicketDto } from '../dtos/sale-ticket.dto';
import { Money } from '../../domain/value-objects/money.value';
import { Quantity } from '../../domain/value-objects/quantity.value';

export class DetailedSaleMapper {
  static toDomain(dto: DetailedSaleDTO): DetailedSale {
    const detalles: DetailedSaleItem[] = dto.detalles.map((detalle) => ({
      id: detalle.id,
      producto: {
        id: detalle.producto.id,
        nombre: detalle.producto.nombre,
        precioVenta: Money.fromNumber(Number(detalle.producto.precio_venta), 'Product.precioVenta'),
        codigoBarras: detalle.producto.codigo_barras,
      },
      cantidad: Quantity.fromNumber(detalle.cantidad, 'SaleDetail.cantidad'),
      subtotal: Money.fromNumber(Number(detalle.subtotal), 'SaleDetail.subtotal'),
    }));

    return new DetailedSale({
      id: dto.id,
      idInventario: dto.id_inventario,
      fecha: dto.fecha,
      total: Number(dto.total),
      detalles,
    });
  }

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
      total: Number(dto.total),
      detalles,
    });
  }
}
