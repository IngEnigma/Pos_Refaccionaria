import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginationParams, PaginatedResponse } from '@core/models/pagination.model';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { ProductRepository, ProductSearchParams } from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  private readonly repository = inject(ProductRepository);

  execute(params?: PaginationParams, searchParams?: ProductSearchParams): Observable<PaginatedResponse<Product>> {
    return this.repository.getProducts(params, searchParams);
  }
}
