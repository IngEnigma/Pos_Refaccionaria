import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { CreateSaleUseCase } from '@features/sales/application/usecase/create-sale.usecase';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { CreateSalePayload } from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class SalesFacade {
  private readonly createSaleUseCase = inject(CreateSaleUseCase);
  private readonly getSalesUseCase = inject(GetSalesUseCase);
  private readonly getPaymentMethodsUseCase = inject(GetPaymentMethodsUseCase);
  private readonly logger = inject(LoggerService).withContext('SalesFacade');

  private readonly _sales = signal<readonly Sale[]>([]);
  private readonly _paymentMethods = signal<readonly PaymentMethod[]>([]);
  private readonly _loading = signal(false);
  private readonly _paymentMethodsLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly sales = this._sales.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly paymentMethodsLoading = this._paymentMethodsLoading.asReadonly();
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

  loadPaymentMethods(): void {
    this._paymentMethodsLoading.set(true);
    this._errorMessage.set(null);

    this.getPaymentMethodsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load payment methods', { message });
          return of([]);
        }),
        finalize(() => {
          this._paymentMethodsLoading.set(false);
        }),
      )
      .subscribe((methods) => {
        this._paymentMethods.set(methods);
      });
  }

  createSale(payload: CreateSalePayload) {
    return this.createSaleUseCase.execute(payload);
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
