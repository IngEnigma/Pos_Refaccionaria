import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { ProductTypeResponseDto } from '@features/sales/product-types/infrastructure/dtos/product-type-response.dto';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import {
  CreateProductTypePayload,
  ProductTypeRepository,
  UpdateProductTypePayload,
} from '@features/sales/product-types/domain/repository/product-type-repository';
import {
  ProductTypeFetchError,
  ProductTypeMutationError,
} from '@features/sales/product-types/domain/errors/product-types.errors';
import { ProductTypeMapper } from '@features/sales/product-types/infrastructure/mappers/product-type.mapper';

@Injectable({ providedIn: 'root' })
export class ProductTypeRepositoryImpl implements ProductTypeRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/tipos`;

  getProductTypes(): Observable<ProductType[]> {
    return this.http.get<ProductTypeResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => ProductTypeMapper.fromResponseDto(dto))),
      catchError((error: unknown) =>
        throwError(() => new ProductTypeFetchError('Failed to fetch product types', error)),
      ),
    );
  }

  createProductType(payload: CreateProductTypePayload): Observable<ProductType> {
    return this.http
      .post<unknown>(this.endpoint, ProductTypeMapper.toCreateRequestDto(payload))
      .pipe(
        map((response) => this.resolveProductTypeResponse(response, payload)),
        catchError((error: unknown) =>
          throwError(() => new ProductTypeMutationError('Failed to create product type', error)),
        ),
      );
  }

  updateProductType(id: number, payload: UpdateProductTypePayload): Observable<ProductType> {
    return this.http
      .put<unknown>(`${this.endpoint}/${id}`, ProductTypeMapper.toUpdateRequestDto(payload))
      .pipe(
        map((response) => this.resolveProductTypeResponse(response, payload, id)),
        catchError((error: unknown) =>
          throwError(() => new ProductTypeMutationError('Failed to update product type', error)),
        ),
      );
  }

  deleteProductType(id: number): Observable<boolean> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      map(() => true),
      catchError((error: unknown) =>
        throwError(() => new ProductTypeMutationError('Failed to delete product type', error)),
      ),
    );
  }

  private resolveProductTypeResponse(
    response: unknown,
    payload: CreateProductTypePayload | UpdateProductTypePayload,
    id?: number,
  ): ProductType {
    if (response && typeof response === 'object' && 'id' in response) {
      return ProductTypeMapper.fromResponseDto(response as ProductTypeResponseDto);
    }

    return {
      id: id ?? 0,
      nombre: (payload as CreateProductTypePayload).nombre ?? '',
    };
  }
}
