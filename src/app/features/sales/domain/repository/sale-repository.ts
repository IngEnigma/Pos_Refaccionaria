import { Observable } from 'rxjs';

import { Sale } from '@features/sales/domain/entities/sale.entity';

import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';

export interface SaleItemPayload {
  id: number;
  cantidad: number;
}

export interface CreateSalePayload {
  idMetodoPago: number;
  productos: SaleItemPayload[];
}

export type CreateCompleteSalePayload = CreateSalePayload;

export interface UpdateSalePayload {
  idUsuario?: number | null;
  idMetodoPago?: number | null;
  total?: number;
  fecha?: string;
}

import { DetailedSale } from '@features/sales/domain/entities/detailed-sale.entity';
import { PaginatedResponse } from '@core/models/pagination.model';

export interface SalesListFilters {
  sucursalId?: number | null;
  idInventario?: number | null;
}

export interface SalesPageParams extends SalesListFilters {
  page: number;
  pageSize: number;
}

export abstract class SaleRepository {
  abstract getSales(filters?: SalesListFilters): Observable<Sale[]>;
  abstract getSalesPaginated(params: SalesPageParams): Observable<PaginatedResponse<Sale>>;
  abstract getSaleDetail(id: number): Observable<DetailedSale>;
  abstract getSaleTicket(id: number): Observable<SaleTicket>;
  abstract createSale(payload: CreateSalePayload): Observable<Sale>;
  abstract updateSale(id: number, payload: UpdateSalePayload): Observable<Sale>;
  abstract deleteSale(id: number): Observable<boolean>;
}
