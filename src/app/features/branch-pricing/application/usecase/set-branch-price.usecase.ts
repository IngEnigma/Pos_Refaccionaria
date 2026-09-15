import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import {
  BranchPriceRepository,
  SetBranchPricePayload,
} from '@features/branch-pricing/domain/repository/branch-price-repository';

@Injectable({ providedIn: 'root' })
export class SetBranchPriceUseCase {
  private readonly repository = inject(BranchPriceRepository);

  execute(payload: SetBranchPricePayload): Observable<BranchPrice> {
    return this.repository.setBranchPrice(payload);
  }
}
