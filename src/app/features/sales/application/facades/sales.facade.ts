import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { Sale } from '@features/sales/domain/entities/sale.entity';

@Injectable({ providedIn: 'root' })
export class SalesFacade {
  private readonly getSalesUseCase = inject(GetSalesUseCase);
  private readonly logger = inject(LoggerService).withContext('SalesFacade');

  private readonly _sales = signal<readonly Sale[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly sales = this._sales.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadSales(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getSalesUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load sales', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((sales) => {
        this._sales.set(sales);
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.message || 'No fue posible cargar las ventas.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible cargar las ventas.';
  }
}
