import { Observable } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { PriceHistoryItem } from '@features/branch-pricing/domain/entities/price-history-item.entity';

export interface SetBranchPricePayload {
  idProducto: number;
  idSucursal: number;
  precioVenta: number;
}

export abstract class BranchPriceRepository {
  abstract getActivePrice(idProducto: number, idSucursal: number): Observable<BranchPrice | null>;
  abstract getPriceHistory(idProducto: number, idSucursal: number): Observable<PriceHistoryItem[]>;
  abstract setBranchPrice(payload: SetBranchPricePayload): Observable<BranchPrice>;
  abstract deactivatePrice(id: number): Observable<void>;
}
