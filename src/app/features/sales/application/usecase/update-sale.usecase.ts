import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SaleRepository,
  UpdateSalePayload,
} from '@features/sales/domain/repository/sale-repository';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { Money } from '@features/sales/domain/value-objects/money.value';
import { SaleDate } from '@features/sales/domain/value-objects/sale-date.value';

@Injectable({ providedIn: 'root' })
export class UpdateSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(id: number, payload: UpdateSalePayload): Observable<Sale> {
    if (payload.total !== undefined) {
      Money.fromNumber(payload.total, 'UpdateSale.total');
    }
    if (payload.fecha !== undefined) {
      SaleDate.fromNullable(payload.fecha, 'UpdateSale.fecha');
    }

    return this.repository.updateSale(id, payload);
  }
}
