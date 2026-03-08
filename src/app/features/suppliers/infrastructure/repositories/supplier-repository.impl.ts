import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SupplierResponseDto } from '@features/suppliers/application/dtos/supplier-response.dto';
import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import {
  CreateSupplierPayload,
  SupplierRepository,
  UpdateSupplierPayload,
} from '@features/suppliers/domain/repository/supplier-repository';
import { SupplierMapper } from '@features/suppliers/infrastructure/mappers/supplier.mapper';

@Injectable({ providedIn: 'root' })
export class SupplierRepositoryImpl implements SupplierRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/proveedores`;

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<SupplierResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => SupplierMapper.fromResponseDto(dto))),
    );
  }

  createSupplier(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.http
      .post<SupplierResponseDto>(this.endpoint, SupplierMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => SupplierMapper.fromResponseDto(dto)));
  }

  updateSupplier(id: number, payload: UpdateSupplierPayload): Observable<Supplier> {
    return this.http
      .put<SupplierResponseDto>(`${this.endpoint}/${id}`, SupplierMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => SupplierMapper.fromResponseDto(dto)));
  }

  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
