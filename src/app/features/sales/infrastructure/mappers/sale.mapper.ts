import { SaleCreateRequestDto } from '@features/sales/application/dtos/sale-create-request.dto';
import { SaleResponseDto } from '@features/sales/application/dtos/sale-response.dto';
import { SaleUpdateRequestDto } from '@features/sales/application/dtos/sale-update-request.dto';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import {
  CreateSalePayload,
  UpdateSalePayload,
} from '@features/sales/domain/repository/sale-repository';

export class SaleMapper {
  static fromResponseDto(dto: SaleResponseDto): Sale {
    return {
      id: dto.id,
      idUsuario: dto.id_usuario,
      idMetodoPago: dto.id_metodo_pago ?? dto.id_metodoPago ?? null,
      total: Number(dto.total),
      fecha: dto.fecha,
    };
  }

  static toCreateRequestDto(payload: CreateSalePayload): SaleCreateRequestDto {
    return {
      id_usuario: payload.idUsuario,
      id_metodo_pago: payload.idMetodoPago,
      total: payload.total,
    };
  }

  static toUpdateRequestDto(payload: UpdateSalePayload): SaleUpdateRequestDto {
    return {
      id_usuario: payload.idUsuario,
      id_metodo_pago: payload.idMetodoPago,
      total: payload.total,
      fecha: payload.fecha,
    };
  }
}
