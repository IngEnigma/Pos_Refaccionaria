  import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Sale } from '@features/sales/domain/entities/sale.entity';
import {
  SaleRepository,
  UpdateSalePayload,
} from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class UpdateSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(id: number, payload: UpdateSalePayload): Observable<Sale> {
    return this.repository.updateSale(id, payload);
  }
}
