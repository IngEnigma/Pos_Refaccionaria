import { SaleDetailResponseDto } from '@features/sales/infrastructure/dtos/sale-detail-response.dto';
import { SaleDetail, SaleDetailFactory } from '@features/sales/domain/entities/sale-detail.entity';
import { Money } from '@features/sales/domain/value-objects/money.value';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';

/** Solo lectura: no se construyen requests a /detalleventa/ (escritura deprecada). */
export class SaleDetailMapper {
  static fromResponseDto(dto: SaleDetailResponseDto): SaleDetail {
    const subtotal = Number(dto.subtotal);
    Money.fromNumber(subtotal, 'SaleDetail.subtotal');
    Quantity.fromNumber(dto.cantidad, 'SaleDetail.cantidad');

    return SaleDetailFactory.fromPrimitives({
      id: dto.id,
      productId: dto.id_producto,
      saleId: dto.id_venta,
      subtotal,
      cantidad: dto.cantidad,
    });
  }
}
