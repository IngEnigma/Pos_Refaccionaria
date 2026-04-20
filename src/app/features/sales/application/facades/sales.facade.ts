import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, throwError } from 'rxjs';

import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { CreateSaleUseCase } from '@features/sales/application/usecase/create-sale.usecase';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { SalesDomainError } from '@features/sales/domain/errors/sales.errors';
import { CreateSalePayload } from '@features/sales/domain/repository/sale-repository';

@Injectable({ providedIn: 'root' })
export class SalesFacade {
  private readonly createSaleUseCase = inject(CreateSaleUseCase);
  private readonly getSalesUseCase = inject(GetSalesUseCase);
  private readonly getPaymentMethodsUseCase = inject(GetPaymentMethodsUseCase);
  private readonly logger = inject(LOGGER_PORT).withContext('SalesFacade');
  private readonly sessionState = inject(SessionStateService);

  private readonly _sales = signal<readonly Sale[]>([]);
  private readonly _paymentMethods = signal<readonly PaymentMethod[]>([]);
  private readonly _isLoadingSales = signal(false);
  private readonly _isCreatingSale = signal(false);
  private readonly _paymentMethodsLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly sales = this._sales.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly isLoadingSales = this._isLoadingSales.asReadonly();
  readonly isCreatingSale = this._isCreatingSale.asReadonly();
  readonly paymentMethodsLoading = this._paymentMethodsLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadSales(): void {
    this._isLoadingSales.set(true);
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
          this._isLoadingSales.set(false);
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

  createSale(payload: Omit<CreateSalePayload, 'idUsuario'>) {
    const session = this.sessionState.getSession();
    const userId = session ? Number(session.userId) : NaN;
    if (!Number.isFinite(userId)) {
      return throwError(() => new Error('No se pudo determinar el usuario actual.'));
    }

    this._isCreatingSale.set(true);
    return this.createSaleUseCase.execute({ ...payload, idUsuario: userId }).pipe(
      finalize(() => {
        this._isCreatingSale.set(false);
      })
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof SalesDomainError) {
      return error.message;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible cargar las ventas.';
  }
}
