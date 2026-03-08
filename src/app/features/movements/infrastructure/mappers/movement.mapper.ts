import { MovementCreateRequestDto } from '@features/movements/application/dtos/movement-create-request.dto';
import { MovementResponseDto } from '@features/movements/application/dtos/movement-response.dto';
import { MovementUpdateRequestDto } from '@features/movements/application/dtos/movement-update-request.dto';
import { Movement } from '@features/movements/domain/entities/movement.entity';
import {
  CreateMovementPayload,
  UpdateMovementPayload,
} from '@features/movements/domain/repository/movement-repository';

export class MovementMapper {
  static fromResponseDto(dto: MovementResponseDto): Movement {
    return {
      id: dto.id,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      fecha: dto.fecha,
      razon: dto.razon,
      observacion: dto.observacion,
    };
  }

  static toCreateRequestDto(payload: CreateMovementPayload): MovementCreateRequestDto {
    return {
      tipo: payload.tipo,
      cantidad: payload.cantidad,
      razon: payload.razon,
      observacion: payload.observacion,
    };
  }

  static toUpdateRequestDto(payload: UpdateMovementPayload): MovementUpdateRequestDto {
    return {
      tipo: payload.tipo,
      cantidad: payload.cantidad,
      razon: payload.razon,
      observacion: payload.observacion,
    };
  }
}
