import { inject, Injectable } from '@angular/core';
import { Observable, defer } from 'rxjs';

import {
  CreateSalePayload,
  SaleRepository,
} from '@features/sales/domain/repository/sale-repository';
import { Sale } from '@features/sales/domain/entities/sale.entity';

@Injectable({ providedIn: 'root' })
export class CreateSaleUseCase {
  private readonly repository = inject(SaleRepository);

  execute(payload: CreateSalePayload): Observable<Sale> {
    // Contrato uniforme: los errores de validación viajan por el observable, no se lanzan síncronos.
    return defer(() => {
      if (!payload.idMetodoPago) throw new Error('CreateSale: idMetodoPago requerido');
      return this.repository.createSale(payload);
    });
  }
}
