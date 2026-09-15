import { SaleCreateRequestDto } from '@features/sales/infrastructure/dtos/sale-create-request.dto';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';
import { SaleUpdateRequestDto } from '@features/sales/infrastructure/dtos/sale-update-request.dto';
import { Sale, SaleFactory } from '@features/sales/domain/entities/sale.entity';
import {
  CreateSalePayload,
  UpdateSalePayload,
} from '@features/sales/domain/repository/sale-repository';
import { Money } from '@features/sales/domain/value-objects/money.value';

export class SaleMapper {
  static fromResponseDto(dto: SaleResponseDto): Sale {
    const total = Number(dto.total);
    Money.fromNumber(total, 'Sale.total');

    return SaleFactory.fromPrimitives({
      id: dto.id,
      idUsuario: dto.id_usuario,
      idInventario: dto.id_inventario,
      idMetodoPago: dto.id_metodoPago,
      total,
      fecha: dto.fecha,
    });
  }

  static toCreateRequestDto(payload: CreateSalePayload): SaleCreateRequestDto {
    return {
      id_inventario: payload.idInventario,
      id_metodoPago: payload.idMetodoPago,
      productos: payload.productos,
    };
  }

  static toUpdateRequestDto(payload: UpdateSalePayload): SaleUpdateRequestDto {
    return {
      id_usuario: payload.idUsuario,
      id_metodoPago: payload.idMetodoPago,
      total: payload.total,
      fecha: payload.fecha,
    };
  }
}
