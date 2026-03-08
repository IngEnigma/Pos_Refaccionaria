import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetailRepository } from '@features/sale-details/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class DeleteSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteSaleDetail(id);
  }
}
