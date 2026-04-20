import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { PaymentMethodResponseDto } from '@features/sales/infrastructure/dtos/payment-method-response.dto';
import {
  CreatePaymentMethodPayload,
  PaymentMethodRepository,
  UpdatePaymentMethodPayload,
} from '@features/sales/domain/repository/payment-method-repository';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import {
  PaymentMethodFetchError,
  PaymentMethodMutationError,
} from '@features/sales/domain/errors/sales.errors';
import { PaymentMethodMapper } from '@features/sales/infrastructure/mappers/payment-method.mapper';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';

@Injectable({ providedIn: 'root' })
export class PaymentMethodRepositoryImpl implements PaymentMethodRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}${SALE_ENDPOINTS.PAYMENT_METHODS}`;

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethodResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => PaymentMethodMapper.fromResponseDto(dto))),
      catchError((error: unknown) =>
        throwError(() => new PaymentMethodFetchError('Failed to fetch payment methods', error)),
      ),
    );
  }

  createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http
      .post<unknown>(this.endpoint, PaymentMethodMapper.toCreateRequestDto(payload))
      .pipe(
        map((response) => this.resolvePaymentMethodResponse(response, payload)),
        catchError((error: unknown) =>
          throwError(() => new PaymentMethodMutationError('Failed to create payment method', error)),
        ),
      );
  }

  updatePaymentMethod(id: number, payload: UpdatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http
      .put<unknown>(`${this.endpoint}/${id}`, PaymentMethodMapper.toUpdateRequestDto(payload))
      .pipe(
        map((response) => this.resolvePaymentMethodResponse(response, payload, id)),
        catchError((error: unknown) =>
          throwError(() => new PaymentMethodMutationError('Failed to update payment method', error)),
        ),
      );
  }

  deletePaymentMethod(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      map(() => true),
      catchError((error: unknown) =>
        throwError(() => new PaymentMethodMutationError('Failed to delete payment method', error)),
      ),
    );
  }

  private resolvePaymentMethodResponse(
    response: unknown,
    payload: CreatePaymentMethodPayload | UpdatePaymentMethodPayload,
    id?: number,
  ): PaymentMethod {
    if (response && typeof response === 'object' && 'id' in response) {
      return PaymentMethodMapper.fromResponseDto(response as PaymentMethodResponseDto);
    }

    return {
      id: id ?? 0,
      tipo: (payload as CreatePaymentMethodPayload).tipo ?? '',
      descripcion: (payload as CreatePaymentMethodPayload).descripcion ?? '',
    };
  }
}
