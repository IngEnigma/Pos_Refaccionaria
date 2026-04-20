import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginationParams, PaginatedResponse } from '@core/models/pagination.model';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class GetProductsByCategoryUseCase {
  private readonly productRepository = inject(ProductRepository);

  execute(categoria: string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    return this.productRepository.getProductsByCategoria(categoria, params);
  }
}
