import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';
import { SaleDetailRepository } from '@features/sale-details/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class GetSaleDetailsUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(): Observable<SaleDetail[]> {
    return this.repository.getSaleDetails();
  }
}
