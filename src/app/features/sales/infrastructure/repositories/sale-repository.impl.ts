import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SaleResponseDto } from '@features/sales/application/dtos/sale-response.dto';
import { Sale } from '@features/sales/domain/entities/sale.entity';
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
    );
  }

  createSale(payload: CreateSalePayload): Observable<Sale> {
    return this.http
      .post<SaleResponseDto>(this.endpoint, SaleMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => SaleMapper.fromResponseDto(dto)));
  }

  updateSale(id: number, payload: UpdateSalePayload): Observable<Sale> {
    return this.http
      .put<SaleResponseDto>(`${this.endpoint}/${id}`, SaleMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => SaleMapper.fromResponseDto(dto)));
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
