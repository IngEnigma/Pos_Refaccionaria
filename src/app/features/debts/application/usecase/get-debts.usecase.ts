import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Debt, DebtStatus, DebtRepository } from '../../domain/debt';

@Injectable({ providedIn: 'root' })
export class GetDebtsUseCase {
  private readonly repository = inject(DebtRepository);

  execute(status?: DebtStatus): Observable<Debt[]> {
    return this.repository.getDebts(status);
  }
}
