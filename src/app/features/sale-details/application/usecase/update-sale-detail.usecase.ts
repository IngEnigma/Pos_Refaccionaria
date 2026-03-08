import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';
import {
  SaleDetailRepository,
  UpdateSaleDetailPayload,
} from '@features/sale-details/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class UpdateSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(id: number, payload: UpdateSaleDetailPayload): Observable<SaleDetail> {
    return this.repository.updateSaleDetail(id, payload);
  }
}
