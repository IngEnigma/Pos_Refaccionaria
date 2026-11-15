import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { isValidBranchPrice } from '@features/branch-pricing/domain/rules/branch-price.rule';
import {
  BranchPriceRepository,
  SetBranchPricePayload,
} from '@features/branch-pricing/domain/repository/branch-price-repository';

@Injectable({ providedIn: 'root' })
export class SetBranchPriceUseCase {
  private readonly repository = inject(BranchPriceRepository);

  execute(payload: SetBranchPricePayload): Observable<BranchPrice> {
    if (!isValidBranchPrice(payload.precioVenta)) {
      return throwError(() => new Error('El precio debe ser mayor a 0, con máximo 2 decimales y hasta 99999999.99.'));
    }
    return this.repository.setBranchPrice(payload);
  }
}
