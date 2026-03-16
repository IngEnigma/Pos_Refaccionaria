import { SaleDetailResponseDto } from '@features/sales/infrastructure/dtos/sale-detail-response.dto';
import { SaleDetailCreateRequestDto } from '@features/sales/infrastructure/dtos/sale-detail-create-request.dto';
import { SaleDetailUpdateRequestDto } from '@features/sales/infrastructure/dtos/sale-detail-update-request.dto';
import { SaleDetail, SaleDetailFactory } from '@features/sales/domain/entities/sale-detail.entity';
import {
  CreateSaleDetailPayload,
  UpdateSaleDetailPayload,
} from '@features/sales/domain/repository/sale-detail-repository';
import { Money } from '@features/sales/domain/value-objects/money.value';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';

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

  static toCreateRequestDto(
    payload: CreateSaleDetailPayload,
  ): SaleDetailCreateRequestDto {
    return {
      id_producto: payload.productId,
      id_venta: payload.saleId,
      cantidad: payload.cantidad,
    };
  }

  static toUpdateRequestDto(
    payload: UpdateSaleDetailPayload,
  ): SaleDetailUpdateRequestDto {
    const dto: SaleDetailUpdateRequestDto = {};
    if (payload.productId !== undefined) dto.id_producto = payload.productId;
    if (payload.saleId !== undefined) dto.id_venta = payload.saleId;
    if (payload.cantidad !== undefined) dto.cantidad = payload.cantidad;
    return dto;
  }
}
