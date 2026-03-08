import { Observable } from 'rxjs';

import { Product } from '@features/inventory/domain/entities/product.entity';

export interface CreateProductPayload {
  idTipo: number | null;
  idProveedor: number | null;
  idMovimientos: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigoBarras: string;
  precioVenta: number;
  marca: string;
  existencia: number;
  costo: number;
  codigoSat: string | null;
}

export interface UpdateProductPayload {
  idTipo?: number | null;
  idProveedor?: number | null;
  idMovimientos?: number | null;
  clave?: string;
  nombre?: string;
  descripcion?: string | null;
  codigoBarras?: string;
  precioVenta?: number;
  marca?: string;
  existencia?: number;
  costo?: number;
  codigoSat?: string | null;
}

export abstract class ProductRepository {
  abstract getProducts(): Observable<Product[]>;
  abstract createProduct(payload: CreateProductPayload): Observable<Product>;
  abstract updateProduct(id: number, payload: UpdateProductPayload): Observable<Product>;
  abstract deleteProduct(id: number): Observable<void>;
}
