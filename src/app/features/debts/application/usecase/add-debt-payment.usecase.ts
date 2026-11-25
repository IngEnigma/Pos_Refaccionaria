import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DebtPayment, DebtRepository } from '../../domain/debt';

@Injectable({ providedIn: 'root' })
export class AddDebtPaymentUseCase {
  private readonly repository = inject(DebtRepository);

  execute(debtId: number, amount: number, paymentMethodId: number | null): Observable<DebtPayment> {
    return this.repository.addPayment(debtId, amount, paymentMethodId);
  }
}
