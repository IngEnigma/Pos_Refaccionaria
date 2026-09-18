import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';
import { SaleTicketDto } from '@features/sales/infrastructure/dtos/sale-ticket.dto';
import { Sale, SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { DetailedSale } from '@features/sales/domain/entities/detailed-sale.entity';
import {
  SaleCreationError,
  SaleDeleteError,
  SaleFetchError,
  SaleUpdateError,
} from '@features/sales/domain/errors/sales.errors';
import {
  CreateSalePayload,
  SaleRepository,
  UpdateSalePayload,
} from '@features/sales/domain/repository/sale-repository';
import { SaleMapper } from '@features/sales/infrastructure/mappers/sale.mapper';
import { DetailedSaleMapper } from '@features/sales/infrastructure/mappers/detailed-sale.mapper';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import { resolveHttpErrorMessage } from '@features/sales/infrastructure/utils/http-error-resolver';

@Injectable({ providedIn: 'root' })
export class SaleRepositoryImpl implements SaleRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly logger = inject(LOGGER_PORT).withContext('SaleRepository');
  private readonly endpoint = `${this.env.apiUrl}${SALE_ENDPOINTS.BASE}`;


  getSales(): Observable<Sale[]> {
    return this.http.get<SaleResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => SaleMapper.fromResponseDto(dto))),
      catchError((error: unknown) => {
        this.logger.error('Failed to fetch sales', { url: this.endpoint, error });
        return throwError(
          () =>
            new SaleFetchError(
              resolveHttpErrorMessage(error, 'Failed to fetch sales'),
              error,
            ),
        );
      }),
    );
  }

  getSaleDetail(id: number): Observable<DetailedSale> {
    const detailUrl = `${this.env.apiUrl}${SALE_ENDPOINTS.TICKET}${id}/ticket/`;
    return this.http.get<SaleTicketDto>(detailUrl).pipe(
      map((dto) => DetailedSaleMapper.fromTicket(dto)),
      catchError((error: unknown) => {
        this.logger.error('Failed to fetch sale detail', { url: detailUrl, id, error });
        return throwError(
          () =>
            new SaleFetchError(
              resolveHttpErrorMessage(error, 'Failed to fetch sale detail'),
              error,
            ),
        );
      }),
    );
  }

  createSale(payload: CreateSalePayload): Observable<Sale> {
    return this.http
      .post<unknown>(this.endpoint, SaleMapper.toCreateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleResponse(response, payload)),
        catchError((error: unknown) => {
          this.logger.error('Failed to create sale', { url: this.endpoint, error });
          return throwError(
            () =>
              new SaleCreationError(
                resolveHttpErrorMessage(error, 'Failed to create sale'),
                error,
              ),
          );
        }),
      );
  }

  updateSale(id: number, payload: UpdateSalePayload): Observable<Sale> {
    return this.http
      .put<unknown>(`${this.endpoint}${id}/`, SaleMapper.toUpdateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleResponse(response, payload, id)),
        catchError((error: unknown) => {
          this.logger.error('Failed to update sale', { url: this.endpoint, id, error });
          return throwError(
            () =>
              new SaleUpdateError(
                resolveHttpErrorMessage(error, 'Failed to update sale'),
                error,
              ),
          );
        }),
      );
  }

  deleteSale(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.endpoint}${id}/`).pipe(
      map(() => true),
      catchError((error: unknown) => {
        this.logger.error('Failed to delete sale', { url: this.endpoint, id, error });
        return throwError(
          () =>
            new SaleDeleteError(
              resolveHttpErrorMessage(error, 'Failed to delete sale'),
              error,
            ),
        );
      }),
    );
  }

  private resolveSaleResponse(
    response: unknown,
    payload: CreateSalePayload | UpdateSalePayload,
    id?: number,
  ): Sale {
    if (response && typeof response === 'object' && 'id' in response && 'total' in response) {
      return SaleMapper.fromResponseDto(response as SaleResponseDto);
    }

    const total = Number((payload as UpdateSalePayload).total ?? 0);
    const fecha = (payload as UpdateSalePayload).fecha ?? null;

    return SaleFactory.fromPrimitives({
      id: id ?? 0,
      idUsuario: null,
      idInventario: null,
      idMetodoPago: (payload as CreateSalePayload).idMetodoPago ?? (payload as UpdateSalePayload).idMetodoPago ?? null,
      total,
      fecha,
    });
  }
}
