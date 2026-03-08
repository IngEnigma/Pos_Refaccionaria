import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '@features/inventory/domain/entities/product.entity';
import {
  CreateProductPayload,
  ProductRepository,
} from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class CreateProductUseCase {
  private readonly repository = inject(ProductRepository);

  execute(payload: CreateProductPayload): Observable<Product> {
    return this.repository.createProduct(payload);
  }
}
