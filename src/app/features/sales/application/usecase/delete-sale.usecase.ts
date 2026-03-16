import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class DeleteSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(id: number): Observable<boolean> {
    return this.repository.deleteSale(id);
  }
}
