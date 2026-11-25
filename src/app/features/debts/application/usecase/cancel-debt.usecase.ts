import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DebtRepository } from '../../domain/debt';

@Injectable({ providedIn: 'root' })
export class CancelDebtUseCase {
  private readonly repository = inject(DebtRepository);

  execute(id: number): Observable<void> {
    return this.repository.cancelDebt(id);
  }
}
