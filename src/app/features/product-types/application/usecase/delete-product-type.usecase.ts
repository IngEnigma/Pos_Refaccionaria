import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProductTypeRepository } from '@features/product-types/domain/repository/product-type-repository';

@Injectable({ providedIn: 'root' })
export class DeleteProductTypeUseCase {
  private readonly repository = inject(ProductTypeRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteProductType(id);
  }
}
