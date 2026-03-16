import { PaymentMethodResponseDto } from '@features/sales/infrastructure/dtos/payment-method-response.dto';
import { PaymentMethodCreateRequestDto } from '@features/sales/infrastructure/dtos/payment-method-create-request.dto';
import { PaymentMethodUpdateRequestDto } from '@features/sales/infrastructure/dtos/payment-method-update-request.dto';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import {
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '@features/sales/domain/repository/payment-method-repository';

export class PaymentMethodMapper {
  static fromResponseDto(dto: PaymentMethodResponseDto): PaymentMethod {
    return {
      id: dto.id,
      tipo: dto.tipo,
      descripcion: dto.descripcion,
    };
  }

  static toCreateRequestDto(
    payload: CreatePaymentMethodPayload,
  ): PaymentMethodCreateRequestDto {
    return {
      tipo: payload.tipo,
      descripcion: payload.descripcion,
    };
  }

  static toUpdateRequestDto(
    payload: UpdatePaymentMethodPayload,
  ): PaymentMethodUpdateRequestDto {
    const dto: PaymentMethodUpdateRequestDto = {};
    if (payload.tipo !== undefined) dto.tipo = payload.tipo;
    if (payload.descripcion !== undefined) dto.descripcion = payload.descripcion;
    return dto;
  }
}
