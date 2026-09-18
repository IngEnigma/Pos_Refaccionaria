import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateSalePayload,
  SaleRepository,
} from '@features/sales/domain/repository/sale-repository';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';
import { Sale } from '@features/sales/domain/entities/sale.entity';

@Injectable({ providedIn: 'root' })
export class CreateSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(payload: CreateSalePayload): Observable<Sale> {
    if (!payload.idMetodoPago) throw new Error('CreateSale: idMetodoPago requerido');
    return this.repository.createSale(payload);
  }
}
