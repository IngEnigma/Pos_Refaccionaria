import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';
import {
  CreateSaleDetailPayload,
  SaleDetailRepository,
} from '@features/sale-details/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class CreateSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(payload: CreateSaleDetailPayload): Observable<SaleDetail> {
    return this.repository.createSaleDetail(payload);
  }
}
