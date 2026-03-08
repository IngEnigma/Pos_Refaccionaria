import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethod } from '@features/payment-methods/domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '@features/payment-methods/domain/repository/payment-method-repository';

@Injectable({ providedIn: 'root' })
export class GetPaymentMethodsUseCase {
  private readonly repository = inject(PaymentMethodRepository);

  execute(): Observable<PaymentMethod[]> {
    return this.repository.getPaymentMethods();
  }
}
