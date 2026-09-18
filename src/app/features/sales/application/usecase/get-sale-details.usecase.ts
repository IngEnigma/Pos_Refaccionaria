import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';

@Injectable({ providedIn: 'root' })
export class GetSaleDetailsUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(): Observable<SaleDetail[]> {
    return this.repository.getSaleDetails();
  }
}
