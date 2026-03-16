import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetProductTypesUseCase } from '@features/sales/product-types/application/usecase/get-product-types.usecase';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';

@Injectable({ providedIn: 'root' })
export class ProductTypesFacade {
  private readonly getProductTypesUseCase = inject(GetProductTypesUseCase);
  private readonly logger = inject(LoggerService).withContext('ProductTypesFacade');

  private readonly _productTypes = signal<readonly ProductType[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly productTypes = this._productTypes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadProductTypes(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getProductTypesUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load product types', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((types) => {
        this._productTypes.set(types);
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.message || 'No fue posible cargar las categorias.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible cargar las categorias.';
  }
}
