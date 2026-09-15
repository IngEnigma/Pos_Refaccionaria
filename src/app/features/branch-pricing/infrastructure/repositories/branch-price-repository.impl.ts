import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { BranchPriceResponseDto } from '@features/branch-pricing/application/dtos/branch-price-response.dto';
import { PriceHistoryResponseDto } from '@features/branch-pricing/application/dtos/price-history-response.dto';
import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { PriceHistoryItem } from '@features/branch-pricing/domain/entities/price-history-item.entity';
import {
  BranchPriceRepository,
  SetBranchPricePayload,
} from '@features/branch-pricing/domain/repository/branch-price-repository';
import { BranchPriceMapper } from '@features/branch-pricing/infrastructure/mappers/branch-price.mapper';

@Injectable({ providedIn: 'root' })
export class BranchPriceRepositoryImpl implements BranchPriceRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/precios-sucursal`;

  getActivePrice(idProducto: number, idSucursal: number): Observable<BranchPrice | null> {
    const params = new HttpParams()
      .set('id_producto', idProducto.toString())
      .set('id_sucursal', idSucursal.toString());

    return this.http
      .get<BranchPriceResponseDto>(`${this.endpoint}/activo/`, { params })
      .pipe(map((dto) => BranchPriceMapper.fromResponseDto(dto)));
  }

  getPriceHistory(idProducto: number, idSucursal: number): Observable<PriceHistoryItem[]> {
    const params = new HttpParams()
      .set('id_producto', idProducto.toString())
      .set('id_sucursal', idSucursal.toString());

    return this.http
      .get<PriceHistoryResponseDto[]>(`${this.endpoint}/historial/`, { params })
      .pipe(map((response) => response.map((dto) => BranchPriceMapper.fromHistoryResponseDto(dto))));
  }

  setBranchPrice(payload: SetBranchPricePayload): Observable<BranchPrice> {
    return this.http
      .post<BranchPriceResponseDto>(this.endpoint, BranchPriceMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => BranchPriceMapper.fromResponseDto(dto)));
  }

  deactivatePrice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
