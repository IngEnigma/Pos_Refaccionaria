import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';

@Injectable({ providedIn: 'root' })
export class GetActivePriceUseCase {
  private readonly repository = inject(BranchPriceRepository);

  execute(idProducto: number, idSucursal: number): Observable<BranchPrice | null> {
    return this.repository.getActivePrice(idProducto, idSucursal);
  }
}
