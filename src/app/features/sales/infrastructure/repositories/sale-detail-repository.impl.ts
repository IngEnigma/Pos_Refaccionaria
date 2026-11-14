import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SaleDetailResponseDto } from '@features/sales/infrastructure/dtos/sale-detail-response.dto';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { SaleDetailFetchError } from '@features/sales/domain/errors/sales.errors';
import { SaleDetailMapper } from '@features/sales/infrastructure/mappers/sale-detail.mapper';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import { resolveHttpErrorMessage } from '@features/sales/infrastructure/utils/http-error-resolver';

/**
 * Solo lectura. No emitir POST/PUT/DELETE a /detalleventa/:
 * la venta es atómica vía POST /ventas/ con detalles incluidos.
 */
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
}
