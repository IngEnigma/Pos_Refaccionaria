import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductType } from '@features/product-types/domain/entities/product-type.entity';
import {
  ProductTypeRepository,
  UpdateProductTypePayload,
} from '@features/product-types/domain/repository/product-type-repository';

@Injectable({ providedIn: 'root' })
export class UpdateProductTypeUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(id: number, payload: UpdateProductTypePayload): Observable<ProductType> {
    return this.repository.updateProductType(id, payload);
  }
}
