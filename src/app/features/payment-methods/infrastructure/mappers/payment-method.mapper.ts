import { PaymentMethodCreateRequestDto } from '@features/payment-methods/application/dtos/payment-method-create-request.dto';
import { PaymentMethodResponseDto } from '@features/payment-methods/application/dtos/payment-method-response.dto';
import { PaymentMethodUpdateRequestDto } from '@features/payment-methods/application/dtos/payment-method-update-request.dto';
import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';
import {
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from '@features/payment-methods/domain/repository/payment-method-repository';

export class PaymentMethodMapper {
  static fromResponseDto(dto: PaymentMethodResponseDto): PaymentMethod {
    return {
      id: dto.id,
      tipo: dto.tipo,
      descripcion: dto.descripcion,
    };
  }

  static toCreateRequestDto(payload: CreatePaymentMethodPayload): PaymentMethodCreateRequestDto {
    return {
      tipo: payload.tipo,
      descripcion: payload.descripcion,
    };
  }

  static toUpdateRequestDto(payload: UpdatePaymentMethodPayload): PaymentMethodUpdateRequestDto {
    return {
      tipo: payload.tipo,
      descripcion: payload.descripcion,
    };
  }
}
