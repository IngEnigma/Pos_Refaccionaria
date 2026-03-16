import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetProductsUseCase } from '../usecase/get-products.usecase';
import { Product } from '../../domain/entities/product.entity';

@Injectable({ providedIn: 'root' })
export class InventoryFacade {
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly logger = inject(LoggerService).withContext('InventoryFacade');

  private readonly _products = signal<readonly Product[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadProducts(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getProductsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load products', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((products) => {
        this._products.set(products);
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.message || 'No fue posible cargar los productos.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible cargar los productos.';
  }
}
