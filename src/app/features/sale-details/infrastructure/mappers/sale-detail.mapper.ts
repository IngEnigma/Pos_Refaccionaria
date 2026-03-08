import { SaleDetailCreateRequestDto } from '@features/sale-details/application/dtos/sale-detail-create-request.dto';
import { SaleDetailResponseDto } from '@features/sale-details/application/dtos/sale-detail-response.dto';
import { SaleDetailUpdateRequestDto } from '@features/sale-details/application/dtos/sale-detail-update-request.dto';
import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';
import {
  CreateSaleDetailPayload,
  UpdateSaleDetailPayload,
} from '@features/sale-details/domain/repository/sale-detail-repository';

export class SaleDetailMapper {
  static fromResponseDto(dto: SaleDetailResponseDto): SaleDetail {
    return {
      id: dto.id,
      idProducto: dto.id_producto,
      idVenta: dto.id_venta,
      subtotal: Number(dto.subtotal),
      cantidad: dto.cantidad,
    };
  }

  static toCreateRequestDto(payload: CreateSaleDetailPayload): SaleDetailCreateRequestDto {
    return {
      id_producto: payload.idProducto,
      id_venta: payload.idVenta,
      subtotal: payload.subtotal,
      cantidad: payload.cantidad,
    };
  }

  static toUpdateRequestDto(payload: UpdateSaleDetailPayload): SaleDetailUpdateRequestDto {
    return {
      id_producto: payload.idProducto,
      id_venta: payload.idVenta,
      subtotal: payload.subtotal,
      cantidad: payload.cantidad,
    };
  }
}
