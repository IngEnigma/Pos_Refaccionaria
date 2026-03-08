import { Observable } from 'rxjs';

import { ProductType } from '@features/product-types/domain/entities/product-type.entity';

export interface CreateProductTypePayload {
  nombre: string;
}

export interface UpdateProductTypePayload {
  nombre?: string;
}

export abstract class ProductTypeRepository {
  abstract getProductTypes(): Observable<ProductType[]>;
  abstract createProductType(payload: CreateProductTypePayload): Observable<ProductType>;
  abstract updateProductType(id: number, payload: UpdateProductTypePayload): Observable<ProductType>;
  abstract deleteProductType(id: number): Observable<void>;
}
