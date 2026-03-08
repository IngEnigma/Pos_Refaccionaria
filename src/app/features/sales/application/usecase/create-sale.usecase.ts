import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Sale } from '@features/sales/domain/entities/sale.entity';
import {
  CreateSalePayload,
  SaleRepository,
} from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class CreateSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(payload: CreateSalePayload): Observable<Sale> {
    return this.repository.createSale(payload);
  }
}
