import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { SaleRepository, CreateCompleteSalePayload } from '@features/sales/domain/repository/sale-repository';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';

export interface CompleteSaleResult {
  sale: Sale;
  ticket: SaleTicket;
}

/**
 * Venta atómica: un solo POST /api/ventas/ con { id_metodoPago, detalles }.
 * Ya no hace peticiones a /api/detalleventa/ (endpoint deprecado para escritura).
 */
@Injectable({ providedIn: 'root' })
export class CreateCompleteSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);

  execute(payload: CreateCompleteSalePayload): Observable<CompleteSaleResult> {
    if (!payload.productos.length) {
      return throwError(() => new Error('CreateCompleteSale: at least one product is required'));
    }
    payload.productos.forEach((item) => {
      Quantity.fromNumber(item.cantidad, 'CreateCompleteSale.productos.cantidad');
    });

    return this.saleRepository
      .createSale({
        idMetodoPago: payload.idMetodoPago,
        productos: payload.productos,
      })
      .pipe(
        concatMap((sale: Sale) =>
          this.saleRepository.getSaleTicket(sale.id).pipe(
            map((ticket) => ({
              sale,
              ticket,
            })),
          ),
        ),
      );
  }
}
