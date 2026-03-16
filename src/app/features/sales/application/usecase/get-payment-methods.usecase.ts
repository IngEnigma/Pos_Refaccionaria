import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '@features/sales/domain/repository/payment-method-repository';

@Injectable({ providedIn: 'root' })
export class GetPaymentMethodsUseCase {
  private readonly repository = inject(PaymentMethodRepository);

  execute(): Observable<PaymentMethod[]> {
    return this.repository.getPaymentMethods();
  }
}
