import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetailRepository, UpdateSaleDetailPayload } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';

@Injectable({ providedIn: 'root' })
export class UpdateSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(id: number, payload: UpdateSaleDetailPayload): Observable<SaleDetail> {
    if (payload.cantidad !== undefined) {
      Quantity.fromNumber(payload.cantidad, 'UpdateSaleDetail.cantidad');
    }
    return this.repository.updateSaleDetail(id, payload);
  }
}
