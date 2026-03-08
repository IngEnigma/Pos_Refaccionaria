import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '@features/inventory/domain/entities/product.entity';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  private readonly repository = inject(ProductRepository);

  execute(): Observable<Product[]> {
    return this.repository.getProducts();
  }
}
