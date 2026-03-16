import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ProductTypeRepository,
  UpdateProductTypePayload,
} from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';

@Injectable({ providedIn: 'root' })
export class UpdateProductTypeUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(id: number, payload: UpdateProductTypePayload): Observable<ProductType> {
    if (payload.nombre !== undefined && !payload.nombre.trim()) {
      throw new Error('UpdateProductType: nombre cannot be empty');
    }
    return this.repository.updateProductType(id, payload);
  }
}
