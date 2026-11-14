import { SaleCreateRequestDto } from '@features/sales/infrastructure/dtos/sale-create-request.dto';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';
import { SalePaginatedResponseDto } from '@features/sales/infrastructure/dtos/sale-paginated-response.dto';
import { PaginatedResponse } from '@core/models/pagination.model';
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
      id_metodoPago: payload.idMetodoPago,
      detalles: (payload.productos ?? []).map((p) => ({
        producto: p.id,
        cantidad: p.cantidad,
      })),
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

  static mapPaginatedResponse(dto: SalePaginatedResponseDto): PaginatedResponse<Sale> {
    const data = (dto.results ?? []).map((item) => this.fromResponseDto(item));
    return {
      data,
      total: dto.total ?? data.length,
      page: dto.page ?? 1,
      limit: dto.page_size ?? data.length,
    };
  }
}
