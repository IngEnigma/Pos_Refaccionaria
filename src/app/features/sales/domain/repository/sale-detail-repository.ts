import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';

export interface CreateSaleDetailPayload {
  productId: number;
  saleId: number;
  cantidad: number;
}

export interface UpdateSaleDetailPayload {
  productId?: number;
  saleId?: number;
  cantidad?: number;
}

export abstract class SaleDetailRepository {
  abstract getSaleDetails(): Observable<SaleDetail[]>;
  abstract createSaleDetail(payload: CreateSaleDetailPayload): Observable<SaleDetail>;
  abstract updateSaleDetail(
    id: number,
    payload: UpdateSaleDetailPayload,
  ): Observable<SaleDetail>;
  abstract deleteSaleDetail(id: number): Observable<boolean>;
}
