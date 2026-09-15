import { DetailedSale, DetailedSaleItem } from '../../domain/entities/detailed-sale.entity';
import { DetailedSaleDTO } from '../dtos/detailed-sale.dto';
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
}
