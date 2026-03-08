import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethodRepository } from '@features/payment-methods/domain/repository/payment-method-repository';

@Injectable({ providedIn: 'root' })
export class DeletePaymentMethodUseCase {
  private readonly repository = inject(PaymentMethodRepository);

  execute(id: number): Observable<void> {
    return this.repository.deletePaymentMethod(id);
  }
}
