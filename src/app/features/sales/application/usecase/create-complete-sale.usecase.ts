import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';

import { SaleRepository, CreateCompleteSalePayload } from '@features/sales/domain/repository/sale-repository';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
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
  private readonly saleDetailRepository = inject(SaleDetailRepository);
  private readonly logger = inject(LOGGER_PORT).withContext('CreateCompleteSaleUseCase');

  execute(payload: CreateCompleteSalePayload): Observable<CompleteSaleResult> {
    if (!payload.productos.length) {
      return throwError(() => new Error('CreateCompleteSale: at least one product is required'));
    }
    payload.productos.forEach((item) => {
      Quantity.fromNumber(item.cantidad, 'CreateCompleteSale.productos.cantidad');
    });

    let createdSaleId: number | null = null;

    return this.saleRepository.createSale({
      idMetodoPago: payload.idMetodoPago,
      idCliente: payload.idCliente,
    }).pipe(
      concatMap((sale: Sale) => {
        createdSaleId = sale.id;

        const detailCalls = payload.productos.map((p) =>
          this.saleDetailRepository.createSaleDetail({
            productId: p.id,
            saleId: sale.id,
            cantidad: p.cantidad,
          })
        );

        return forkJoin(detailCalls).pipe(
          catchError((error: unknown) => {
            this.logger.error('Detalle falló, rollback venta', {
              saleId: createdSaleId,
              error,
            });

            if (createdSaleId != null) {
              return this.saleRepository.deleteSale(createdSaleId).pipe(
                catchError((rollbackError: unknown) => {
                  this.logger.error('Rollback falló', {
                    saleId: createdSaleId,
                    rollbackError,
                  });

                  return throwError(() => error);
                }),
                concatMap(() => throwError(() => error))
              );
            }

            return throwError(() => error);
          }),
          concatMap(() =>
            this.saleRepository.getSaleTicket(sale.id).pipe(
              map((ticket): CompleteSaleResult => ({ sale, ticket })),
              // H-08: la venta ya existe; fallar aquí haría que el cajero cobre dos veces.
              catchError((error: unknown) => {
                this.logger.error('Venta creada pero el ticket falló', { saleId: sale.id, error });
                return of<CompleteSaleResult>({ sale, ticket: null });
              }),
            )
          ),
        );
      })
    );
  }
}
