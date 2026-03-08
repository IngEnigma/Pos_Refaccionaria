import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '@features/inventory/domain/entities/product.entity';
import {
  ProductRepository,
  UpdateProductPayload,
} from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class UpdateProductUseCase {
  private readonly repository = inject(ProductRepository);

  execute(id: number, payload: UpdateProductPayload): Observable<Product> {
    return this.repository.updateProduct(id, payload);
  }
}
