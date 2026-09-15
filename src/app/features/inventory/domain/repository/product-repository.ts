import { Observable } from 'rxjs';

import { PaginationParams, PaginatedResponse } from '@core/models/pagination.model';
import { Product, ProductStock } from '@features/inventory/domain/entities/product.entity';

export interface CreateProductPayload {
  idTipo: number | null;
  idProveedor: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigoBarras: string;
  precioVenta: number;
  marca: string;
  costo: number;
  codigoSat: string | null;
}

export interface UpdateProductPayload {
  idTipo?: number | null;
  idProveedor?: number | null;
  clave?: string;
  nombre?: string;
  descripcion?: string | null;
  codigoBarras?: string;
  precioVenta?: number;
  marca?: string;
  costo?: number;
  codigoSat?: string | null;
}

export interface ProductSearchParams {
  sucursalId?: number;
  search?: string;
  clave?: string;
  marca?: string;
  codigoBarras?: string;
  tipoId?: number;
  proveedorId?: number;
}

export abstract class ProductRepository {
  abstract getProducts(params?: PaginationParams, searchParams?: ProductSearchParams): Observable<PaginatedResponse<Product>>;
  abstract getProductsByCategoria(categoria: string, params?: PaginationParams): Observable<PaginatedResponse<Product>>;
  abstract searchProducts(query: string, params?: PaginationParams, searchParams?: ProductSearchParams): Observable<PaginatedResponse<Product>>;
  abstract getByBarcode(codigoBarras: string): Observable<Product | null>;
  abstract createProduct(payload: CreateProductPayload): Observable<Product>;
  abstract updateProduct(id: number, payload: UpdateProductPayload): Observable<Product>;
  abstract deleteProduct(id: number): Observable<void>;
}
