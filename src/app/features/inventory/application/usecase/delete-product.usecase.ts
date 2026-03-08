import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductRepository } from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class DeleteProductUseCase {
  private readonly repository = inject(ProductRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteProduct(id);
  }
}
