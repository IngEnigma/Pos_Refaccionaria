import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DebtPayment, DebtRepository } from '../../domain/debt';

@Injectable({ providedIn: 'root' })
export class GetDebtPaymentsUseCase {
  private readonly repository = inject(DebtRepository);

  execute(debtId: number): Observable<DebtPayment[]> {
    return this.repository.getPayments(debtId);
  }
}
