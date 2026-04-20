import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleRepository } from '../../domain/repository/sale-repository';
import { DetailedSale } from '../../domain/entities/detailed-sale.entity';

@Injectable({ providedIn: 'root' })
export class GetSaleDetailUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(saleId: number): Observable<DetailedSale> {
    return this.saleRepository.getSaleDetail(saleId);
  }
}
