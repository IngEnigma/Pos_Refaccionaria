import { Observable } from 'rxjs';

import { Sale } from '@features/sales/domain/entities/sale.entity';

export interface CreateSalePayload {
  idMetodoPago: number;
  idInventario: number;
  productos: Array<{
    id: number;
    cantidad: number;
  }>;
}

export interface UpdateSalePayload {
  idUsuario?: number | null;
  idMetodoPago?: number | null;
  total?: number;
  fecha?: string;
}

import { DetailedSale } from '@features/sales/domain/entities/detailed-sale.entity';

export abstract class SaleRepository {
  abstract getSales(): Observable<Sale[]>;
  abstract getSaleDetail(id: number): Observable<DetailedSale>;
  abstract createSale(payload: CreateSalePayload): Observable<Sale>;
  abstract updateSale(id: number, payload: UpdateSalePayload): Observable<Sale>;
  abstract deleteSale(id: number): Observable<boolean>;
}
