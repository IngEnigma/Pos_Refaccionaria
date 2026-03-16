import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';
import { Sale, SaleFactory } from '@features/sales/domain/entities/sale.entity';
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

@Injectable({ providedIn: 'root' })
export class SaleRepositoryImpl implements SaleRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/ventas`;

  getSales(): Observable<Sale[]> {
    return this.http.get<SaleResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => SaleMapper.fromResponseDto(dto))),
      catchError((error: unknown) =>
        throwError(() => new SaleFetchError('Failed to fetch sales', error)),
      ),
    );
  }

  createSale(payload: CreateSalePayload): Observable<Sale> {
    return this.http
      .post<unknown>(this.endpoint, SaleMapper.toCreateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleResponse(response, payload)),
        catchError((error: unknown) =>
          throwError(() => new SaleCreationError('Failed to create sale', error)),
        ),
      );
  }

  updateSale(id: number, payload: UpdateSalePayload): Observable<Sale> {
    return this.http
      .put<unknown>(`${this.endpoint}/${id}`, SaleMapper.toUpdateRequestDto(payload))
      .pipe(
        map((response) => this.resolveSaleResponse(response, payload, id)),
        catchError((error: unknown) =>
          throwError(() => new SaleUpdateError('Failed to update sale', error)),
        ),
      );
  }

  deleteSale(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      map(() => true),
      catchError((error: unknown) =>
        throwError(() => new SaleDeleteError('Failed to delete sale', error)),
      ),
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
      idUsuario: (payload as CreateSalePayload).idUsuario ?? null,
      idMetodoPago: (payload as CreateSalePayload).idMetodoPago ?? null,
      total,
      fecha,
    });
  }
}
