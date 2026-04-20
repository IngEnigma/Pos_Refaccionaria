import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { PaginationParams, PaginatedResponse } from '@core/models/pagination.model';
import {
  PaginatedProductResponseDto,
  ProductResponseDto,
} from '@features/inventory/application/dtos/product-response.dto';
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

  getProducts(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    const httpParams = this.buildPaginationParams(new HttpParams(), params);

    return this.http
      .get<PaginatedProductResponseDto>(this.endpoint, { params: httpParams })
      .pipe(map((response) => ProductMapper.mapPaginatedResponse(response)));
  }

  getProductsByCategoria(categoria: string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams().set('categoria', categoria);
    httpParams = this.buildPaginationParams(httpParams, params);

    return this.http
      .get<PaginatedProductResponseDto>(this.endpoint, { params: httpParams })
      .pipe(map((response) => ProductMapper.mapPaginatedResponse(response)));
  }
  
  searchProducts(query: string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams().set('query', query);
    httpParams = this.buildPaginationParams(httpParams, params);

    return this.http
      .get<PaginatedProductResponseDto>(`${this.endpoint}/search/`, { params: httpParams })
      .pipe(map((response) => ProductMapper.mapPaginatedResponse(response)));
  }

  private buildPaginationParams(httpParams: HttpParams, params?: PaginationParams): HttpParams {
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('page_size', params.limit.toString());
    }
    return httpParams;
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
