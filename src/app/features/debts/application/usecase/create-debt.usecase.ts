import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateDebtPayload, Debt, DebtRepository } from '../../domain/debt';

@Injectable({ providedIn: 'root' })
export class CreateDebtUseCase {
  private readonly repository = inject(DebtRepository);

  execute(payload: CreateDebtPayload): Observable<Debt> {
    return this.repository.createDebt(payload);
  }
}
