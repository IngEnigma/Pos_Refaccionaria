import { BranchPriceResponseDto } from '@features/branch-pricing/application/dtos/branch-price-response.dto';
import { PriceHistoryResponseDto } from '@features/branch-pricing/application/dtos/price-history-response.dto';
import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { PriceHistoryItem } from '@features/branch-pricing/domain/entities/price-history-item.entity';
import { SetBranchPricePayload } from '@features/branch-pricing/domain/repository/branch-price-repository';
import { BranchPriceCreateRequestDto } from '@features/branch-pricing/application/dtos/branch-price-create-request.dto';

export class BranchPriceMapper {
  static fromResponseDto(dto: BranchPriceResponseDto): BranchPrice {
    return {
      id: dto.id,
      idProducto: dto.id_producto,
      idSucursal: dto.id_sucursal,
      precioVenta: parseFloat(dto.precio_venta),
      vigenteDesde: dto.vigente_desde,
      activo: dto.activo,
    };
  }

  static fromHistoryResponseDto(dto: PriceHistoryResponseDto): PriceHistoryItem {
    return {
      id: dto.id,
      idProducto: dto.id_producto,
      idSucursal: dto.id_sucursal,
      precioVenta: parseFloat(dto.precio_venta),
      vigenteDesde: dto.vigente_desde,
      activo: dto.activo,
    };
  }

  static toCreateRequestDto(payload: SetBranchPricePayload): BranchPriceCreateRequestDto {
    return {
      id_producto: payload.idProducto,
      id_sucursal: payload.idSucursal,
      precio_venta: payload.precioVenta,
    };
  }
}
