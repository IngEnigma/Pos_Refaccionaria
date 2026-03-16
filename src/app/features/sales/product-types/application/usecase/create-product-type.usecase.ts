import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CreateProductTypePayload,
  ProductTypeRepository,
} from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';

@Injectable({ providedIn: 'root' })
export class CreateProductTypeUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(payload: CreateProductTypePayload): Observable<ProductType> {
    if (!payload.nombre.trim()) {
      throw new Error('CreateProductType: nombre is required');
    }
    return this.repository.createProductType(payload);
  }
}
