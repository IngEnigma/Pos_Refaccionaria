import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';
import {
  PaymentMethodRepository,
  UpdatePaymentMethodPayload,
} from '@features/payment-methods/domain/repository/payment-method-repository';

@Injectable({ providedIn: 'root' })
export class UpdatePaymentMethodUseCase {
  private readonly repository = inject(PaymentMethodRepository);

  execute(id: number, payload: UpdatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.repository.updatePaymentMethod(id, payload);
  }
}
