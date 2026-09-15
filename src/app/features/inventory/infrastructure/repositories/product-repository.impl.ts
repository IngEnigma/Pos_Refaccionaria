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
  ProductSearchParams,
  UpdateProductPayload,
} from '@features/inventory/domain/repository/product-repository';
import { ProductMapper } from '@features/inventory/infrastructure/mappers/product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductRepositoryImpl implements ProductRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/productos`;

  getProducts(params?: PaginationParams, searchParams?: ProductSearchParams): Observable<PaginatedResponse<Product>> {
    let httpParams = this.buildPaginationParams(new HttpParams(), params);
    httpParams = this.buildSearchParams(httpParams, searchParams);

    const hasSucursalFilter = searchParams?.sucursalId != null;

    return this.http
      .get<PaginatedProductResponseDto>(this.endpoint, { params: httpParams })
      .pipe(
        map((response) =>
          hasSucursalFilter
            ? ProductMapper.mapStockPaginatedResponse(response) as PaginatedResponse<Product>
            : ProductMapper.mapPaginatedResponse(response)
        ),
      );
  }

  getProductsByCategoria(categoria: string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams().set('categoria', categoria);
    httpParams = this.buildPaginationParams(httpParams, params);

    return this.http
      .get<PaginatedProductResponseDto>(this.endpoint, { params: httpParams })
      .pipe(map((response) => ProductMapper.mapPaginatedResponse(response)));
  }
  
  searchProducts(query: string, params?: PaginationParams, searchParams?: ProductSearchParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams().set('search', query);
    httpParams = this.buildPaginationParams(httpParams, params);
    httpParams = this.buildSearchParams(httpParams, searchParams);

    const hasSucursalFilter = searchParams?.sucursalId != null;

    return this.http
      .get<PaginatedProductResponseDto>(this.endpoint, { params: httpParams })
      .pipe(
        map((response) =>
          hasSucursalFilter
            ? ProductMapper.mapStockPaginatedResponse(response) as PaginatedResponse<Product>
            : ProductMapper.mapPaginatedResponse(response)
        ),
      );
  }

  getByBarcode(codigoBarras: string): Observable<Product | null> {
    const url = `${this.endpoint}/codigo-barras/`;
    const params = new HttpParams().set('codigo_barras', codigoBarras);

    return this.http
      .get<ProductResponseDto>(url, { params })
      .pipe(
        map((dto) => ProductMapper.fromResponseDto(dto)),
        // map 404 → null (handled by catchError in caller or here)
      );
  }

  private buildSearchParams(httpParams: HttpParams, searchParams?: ProductSearchParams): HttpParams {
    if (!searchParams) return httpParams;

    if (searchParams.sucursalId != null) {
      httpParams = httpParams.set('sucursal_id', searchParams.sucursalId.toString());
    }
    if (searchParams.search) {
      httpParams = httpParams.set('search', searchParams.search);
    }
    if (searchParams.clave) {
      httpParams = httpParams.set('clave', searchParams.clave);
    }
    if (searchParams.marca) {
      httpParams = httpParams.set('marca', searchParams.marca);
    }
    if (searchParams.codigoBarras) {
      httpParams = httpParams.set('codigo_barras', searchParams.codigoBarras);
    }
    if (searchParams.tipoId != null) {
      httpParams = httpParams.set('tipo_id', searchParams.tipoId.toString());
    }
    if (searchParams.proveedorId != null) {
      httpParams = httpParams.set('proveedor_id', searchParams.proveedorId.toString());
    }

    return httpParams;
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
