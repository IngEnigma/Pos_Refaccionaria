import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Sale } from '@features/sales/domain/entities/sale.entity';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class GetSalesUseCase {
  private readonly repository = inject(SaleRepository);

  execute(): Observable<Sale[]> {
    return this.repository.getSales();
  }
}
