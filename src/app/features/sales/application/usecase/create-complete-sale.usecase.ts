import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';

import { SaleRepository, CreateCompleteSalePayload } from '@features/sales/domain/repository/sale-repository';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';

export interface CompleteSaleResult {
  sale: Sale;
  /** `null` si la venta se registró pero el ticket no pudo obtenerse (H-08). */
  ticket: SaleTicket | null;
}


@Injectable({ providedIn: 'root' })
export class CreateCompleteSaleUseCase {
  private readonly saleRepository = inject(SaleRepository);
  private readonly logger = inject(LOGGER_PORT).withContext('CreateCompleteSaleUseCase');

  execute(payload: CreateCompleteSalePayload): Observable<CompleteSaleResult> {
    if (!payload.productos.length) {
      return throwError(() => new Error('CreateCompleteSale: at least one product is required'));
    }
    payload.productos.forEach((item) => {
      Quantity.fromNumber(item.cantidad, 'CreateCompleteSale.productos.cantidad');
    });

    // H-09/H-38: una sola petición atómica (cabecera + detalles + stock, todo o nada).
    // Antes: venta + N detalles + DELETE de rollback, que el cajero no puede ejecutar (403 `ventas.anular`).
    return this.saleRepository.createSale(payload).pipe(
      concatMap((sale: Sale) =>
        this.saleRepository.getSaleTicket(sale.id).pipe(
          map((ticket): CompleteSaleResult => ({ sale, ticket })),
          // H-08: la venta ya existe; fallar aquí haría que el cajero cobre dos veces.
          catchError((error: unknown) => {
            this.logger.error('Venta creada pero el ticket falló', { saleId: sale.id, error });
            return of<CompleteSaleResult>({ sale, ticket: null });
          }),
        ),
      ),
    );
  }
}
