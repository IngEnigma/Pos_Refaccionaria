import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleDetailRepository, CreateSaleDetailPayload } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';

@Injectable({ providedIn: 'root' })
export class CreateSaleDetailUseCase {
  private readonly repository = inject(SaleDetailRepository);

  execute(payload: CreateSaleDetailPayload): Observable<SaleDetail> {
    Quantity.fromNumber(payload.cantidad, 'CreateSaleDetail.cantidad');
    if (!payload.productId) throw new Error('CreateSaleDetail: productId requerido');
    if (!payload.saleId) throw new Error('CreateSaleDetail: saleId requerido');
    return this.repository.createSaleDetail(payload);
  }
}
