import { Observable } from 'rxjs';

import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';

export interface CreatePaymentMethodPayload {
  tipo: string;
  descripcion: string;
}

export interface UpdatePaymentMethodPayload {
  tipo?: string;
  descripcion?: string;
}

export abstract class PaymentMethodRepository {
  abstract getPaymentMethods(): Observable<PaymentMethod[]>;
  abstract createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<PaymentMethod>;
  abstract updatePaymentMethod(
    id: number,
    payload: UpdatePaymentMethodPayload,
  ): Observable<PaymentMethod>;
  abstract deletePaymentMethod(id: number): Observable<void>;
}
