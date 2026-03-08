import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { PaymentMethodResponseDto } from '@features/payment-methods/application/dtos/payment-method-response.dto';
import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';
import {
  CreatePaymentMethodPayload,
  PaymentMethodRepository,
  UpdatePaymentMethodPayload,
} from '@features/payment-methods/domain/repository/payment-method-repository';
import { PaymentMethodMapper } from '@features/payment-methods/infrastructure/mappers/payment-method.mapper';

@Injectable({ providedIn: 'root' })
export class PaymentMethodRepositoryImpl implements PaymentMethodRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/metodospago`;

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethodResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => PaymentMethodMapper.fromResponseDto(dto))),
    );
  }

  createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http
      .post<PaymentMethodResponseDto>(this.endpoint, PaymentMethodMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => PaymentMethodMapper.fromResponseDto(dto)));
  }

  updatePaymentMethod(id: number, payload: UpdatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http
      .put<PaymentMethodResponseDto>(`${this.endpoint}/${id}`, PaymentMethodMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => PaymentMethodMapper.fromResponseDto(dto)));
  }

  deletePaymentMethod(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
