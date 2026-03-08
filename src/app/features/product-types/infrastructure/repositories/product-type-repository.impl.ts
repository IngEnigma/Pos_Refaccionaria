import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { ProductTypeResponseDto } from '@features/product-types/application/dtos/product-type-response.dto';
import { ProductType } from '@features/product-types/domain/entities/product-type.entity';
import {
  CreateProductTypePayload,
  ProductTypeRepository,
  UpdateProductTypePayload,
} from '@features/product-types/domain/repository/product-type-repository';
import { ProductTypeMapper } from '@features/product-types/infrastructure/mappers/product-type.mapper';

@Injectable({ providedIn: 'root' })
export class ProductTypeRepositoryImpl implements ProductTypeRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/tipos`;

  getProductTypes(): Observable<ProductType[]> {
    return this.http.get<ProductTypeResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => ProductTypeMapper.fromResponseDto(dto))),
    );
  }

  createProductType(payload: CreateProductTypePayload): Observable<ProductType> {
    return this.http
      .post<ProductTypeResponseDto>(this.endpoint, ProductTypeMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => ProductTypeMapper.fromResponseDto(dto)));
  }

  updateProductType(id: number, payload: UpdateProductTypePayload): Observable<ProductType> {
    return this.http
      .put<ProductTypeResponseDto>(`${this.endpoint}/${id}`, ProductTypeMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => ProductTypeMapper.fromResponseDto(dto)));
  }

  deleteProductType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
