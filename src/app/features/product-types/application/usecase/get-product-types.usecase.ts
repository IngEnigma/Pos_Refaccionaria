import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductType } from '@features/product-types/domain/entities/product-type.entity';
import { ProductTypeRepository } from '@features/product-types/domain/repository/product-type-repository';

@Injectable({ providedIn: 'root' })
export class GetProductTypesUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(): Observable<ProductType[]> {
    return this.repository.getProductTypes();
  }
}
