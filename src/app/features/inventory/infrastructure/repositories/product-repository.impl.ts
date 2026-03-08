import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { ProductResponseDto } from '@features/inventory/application/dtos/product-response.dto';
import { Product } from '@features/inventory/domain/entities/product.entity';
import {
  CreateProductPayload,
  ProductRepository,
  UpdateProductPayload,
} from '@features/inventory/domain/repository/product-repository';
import { ProductMapper } from '@features/inventory/infrastructure/mappers/product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductRepositoryImpl implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/productos`;

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => ProductMapper.fromResponseDto(dto))),
    );
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    return this.http
      .post<ProductResponseDto>(this.endpoint, ProductMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => ProductMapper.fromResponseDto(dto)));
  }

  updateProduct(id: number, payload: UpdateProductPayload): Observable<Product> {
    return this.http
      .put<ProductResponseDto>(`${this.endpoint}/${id}`, ProductMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => ProductMapper.fromResponseDto(dto)));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
