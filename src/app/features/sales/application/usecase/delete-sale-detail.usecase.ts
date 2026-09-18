import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class DeleteSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(id: number): Observable<boolean> {
    return this.repository.deleteSaleDetail(id);
  }
}
