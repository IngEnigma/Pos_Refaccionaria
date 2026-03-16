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
    if (!payload.productos.length) {
      throw new Error('CreateSale: at least one product is required');
    }

    payload.productos.forEach((item) => {
      Quantity.fromNumber(item.cantidad, 'CreateSale.productos.cantidad');
    });

    return this.repository.createSale(payload);
  }
}
