import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SaleDetailResponseDto } from '@features/sales/infrastructure/dtos/sale-detail-response.dto';
import {
  CreateSaleDetailPayload,
  SaleDetailRepository,
  UpdateSaleDetailPayload,
} from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail, SaleDetailFactory } from '@features/sales/domain/entities/sale-detail.entity';
import { SaleDetailFetchError, SaleDetailMutationError } from '@features/sales/domain/errors/sales.errors';
import { SaleDetailMapper } from '@features/sales/infrastructure/mappers/sale-detail.mapper';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import { resolveHttpErrorMessage } from '@features/sales/infrastructure/utils/http-error-resolver';

@Injectable({ providedIn: 'root' })
export class SaleDetailRepositoryImpl implements SaleDetailRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly logger = inject(LOGGER_PORT).withContext('SaleDetailRepository');
  private readonly endpoint = `${this.env.apiUrl}${SALE_ENDPOINTS.DETAIL}`;


  getSaleDetails(): Observable<SaleDetail[]> {
    return this.http.get<SaleDetailResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => SaleDetailMapper.fromResponseDto(dto))),
      catchError((error: unknown) => {
        this.logger.error('Failed to fetch sale details', { url: this.endpoint, error });
        return throwError(
          () =>
            new SaleDetailFetchError(
              resolveHttpErrorMessage(error, 'Failed to fetch sale details'),
              error,
            ),
        );
      }),
    );
  }

  createSaleDetail(payload: CreateSaleDetailPayload): Observable<SaleDetail> {
    return this.http
      .post<unknown>(this.endpoint, SaleDetailMapper.toCreateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleDetailResponse(response, payload)),
        catchError((error: unknown) => {
          this.logger.error('Failed to create sale detail', { url: this.endpoint, error });
          return throwError(
            () =>
              new SaleDetailMutationError(
                resolveHttpErrorMessage(error, 'Failed to create sale detail'),
                error,
              ),
          );
        }),
      );
  }

  updateSaleDetail(id: number, payload: UpdateSaleDetailPayload): Observable<SaleDetail> {
    return this.http
      .put<unknown>(`${this.endpoint}${id}/`, SaleDetailMapper.toUpdateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleDetailResponse(response, payload, id)),
        catchError((error: unknown) => {
          this.logger.error('Failed to update sale detail', { url: this.endpoint, id, error });
          return throwError(
            () =>
              new SaleDetailMutationError(
                resolveHttpErrorMessage(error, 'Failed to update sale detail'),
                error,
              ),
          );
        }),
      );
  }

  deleteSaleDetail(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.endpoint}${id}/`).pipe(
      map(() => true),
      catchError((error: unknown) => {
        this.logger.error('Failed to delete sale detail', { url: this.endpoint, id, error });
        return throwError(
          () =>
            new SaleDetailMutationError(
              resolveHttpErrorMessage(error, 'Failed to delete sale detail'),
              error,
            ),
        );
      }),
    );
  }

  private resolveSaleDetailResponse(
    response: unknown,
    payload: CreateSaleDetailPayload | UpdateSaleDetailPayload,
    id?: number,
  ): SaleDetail {
    if (response && typeof response === 'object' && 'id' in response && 'subtotal' in response) {
      return SaleDetailMapper.fromResponseDto(response as SaleDetailResponseDto);
    }

    return SaleDetailFactory.fromPrimitives({
      id: id ?? 0,
      productId: (payload as CreateSaleDetailPayload).productId ?? 0,
      saleId: (payload as CreateSaleDetailPayload).saleId ?? 0,
      subtotal: 0,
      cantidad: (payload as CreateSaleDetailPayload).cantidad ?? 1,
    });
  }
}
