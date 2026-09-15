import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PriceHistoryItem } from '@features/branch-pricing/domain/entities/price-history-item.entity';
import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';

@Injectable({ providedIn: 'root' })
export class GetPriceHistoryUseCase {
  private readonly repository = inject(BranchPriceRepository);

  execute(idProducto: number, idSucursal: number): Observable<PriceHistoryItem[]> {
    return this.repository.getPriceHistory(idProducto, idSucursal);
  }
}
