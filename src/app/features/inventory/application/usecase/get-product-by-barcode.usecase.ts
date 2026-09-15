import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { Product } from '@features/inventory/domain/entities/product.entity';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';

@Injectable({ providedIn: 'root' })
export class GetProductByBarcodeUseCase {
  private readonly repository = inject(ProductRepository);

  execute(codigoBarras: string): Observable<Product | null> {
    return this.repository.getByBarcode(codigoBarras).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }
        throw error;
      }),
    );
  }
}
