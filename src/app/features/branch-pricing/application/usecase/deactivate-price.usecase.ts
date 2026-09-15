import { inject, Injectable } from '@angular/core';

import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';

@Injectable({ providedIn: 'root' })
export class DeactivatePriceUseCase {
  private readonly repository = inject(BranchPriceRepository);

  execute(id: number) {
    return this.repository.deactivatePrice(id);
  }
}
