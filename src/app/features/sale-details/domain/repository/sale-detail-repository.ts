import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';

export interface CreateSaleDetailPayload {
  idProducto: number;
  idVenta: number;
  subtotal: number;
  cantidad: number;
}

export interface UpdateSaleDetailPayload {
  idProducto?: number;
  idVenta?: number;
  subtotal?: number;
  cantidad?: number;
}

export abstract class SaleDetailRepository {
  abstract getSaleDetails(): Observable<SaleDetail[]>;
  abstract createSaleDetail(payload: CreateSaleDetailPayload): Observable<SaleDetail>;
  abstract updateSaleDetail(id: number, payload: UpdateSaleDetailPayload): Observable<SaleDetail>;
  abstract deleteSaleDetail(id: number): Observable<void>;
}
