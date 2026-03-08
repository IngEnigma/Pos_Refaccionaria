import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SaleDetailResponseDto } from '@features/sale-details/application/dtos/sale-detail-response.dto';
import { SaleDetail } from '@features/sale-details/domain/entities/sale-detail.entity';
import {
  CreateSaleDetailPayload,
  SaleDetailRepository,
  UpdateSaleDetailPayload,
} from '@features/sale-details/domain/repository/sale-detail-repository';
import { SaleDetailMapper } from '@features/sale-details/infrastructure/mappers/sale-detail.mapper';

@Injectable({ providedIn: 'root' })
export class SaleDetailRepositoryImpl implements SaleDetailRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/detalleventas`;

  getSaleDetails(): Observable<SaleDetail[]> {
    return this.http.get<SaleDetailResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => SaleDetailMapper.fromResponseDto(dto))),
    );
  }

  createSaleDetail(payload: CreateSaleDetailPayload): Observable<SaleDetail> {
    return this.http
      .post<SaleDetailResponseDto>(this.endpoint, SaleDetailMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => SaleDetailMapper.fromResponseDto(dto)));
  }

  updateSaleDetail(id: number, payload: UpdateSaleDetailPayload): Observable<SaleDetail> {
    return this.http
      .put<SaleDetailResponseDto>(`${this.endpoint}/${id}`, SaleDetailMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => SaleDetailMapper.fromResponseDto(dto)));
  }

  deleteSaleDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
