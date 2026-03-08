import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductType } from '@features/product-types/domain/entities/product-type.entity';
import {
  CreateProductTypePayload,
  ProductTypeRepository,
} from '@features/product-types/domain/repository/product-type-repository';

@Injectable({ providedIn: 'root' })
export class CreateProductTypeUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(payload: CreateProductTypePayload): Observable<ProductType> {
    return this.repository.createProductType(payload);
  }
}
