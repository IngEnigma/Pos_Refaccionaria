import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';
import {
  CreatePaymentMethodPayload,
  PaymentMethodRepository,
} from '@features/payment-methods/domain/repository/payment-method-repository';

@Injectable({ providedIn: 'root' })
export class CreatePaymentMethodUseCase {
  private readonly repository = inject(PaymentMethodRepository);

  execute(payload: CreatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.repository.createPaymentMethod(payload);
  }
}
