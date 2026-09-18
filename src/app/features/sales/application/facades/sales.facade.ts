import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { CreateSaleUseCase } from '@features/sales/application/usecase/create-sale.usecase';
import { CreateCompleteSaleUseCase } from '@features/sales/application/usecase/create-complete-sale.usecase';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { GetSaleDetailUseCase } from '@features/sales/application/usecase/get-sale-detail.usecase';
import { GetSaleDetailsUseCase } from '@features/sales/application/usecase/get-sale-details.usecase';
import { CreateSaleDetailUseCase } from '@features/sales/application/usecase/create-sale-detail.usecase';
import { UpdateSaleDetailUseCase } from '@features/sales/application/usecase/update-sale-detail.usecase';
import { DeleteSaleDetailUseCase } from '@features/sales/application/usecase/delete-sale-detail.usecase';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { DetailedSale } from '@features/sales/domain/entities/detailed-sale.entity';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { SalesDomainError } from '@features/sales/domain/errors/sales.errors';
import { CreateSalePayload, CreateCompleteSalePayload } from '@features/sales/domain/repository/sale-repository';
import { CreateSaleDetailPayload, UpdateSaleDetailPayload } from '@features/sales/domain/repository/sale-detail-repository';

@Injectable({ providedIn: 'root' })
export class SalesFacade {
  private readonly createSaleUseCase = inject(CreateSaleUseCase);
  private readonly createCompleteSaleUseCase = inject(CreateCompleteSaleUseCase);
  private readonly getSalesUseCase = inject(GetSalesUseCase);
  private readonly getSaleDetailUseCase = inject(GetSaleDetailUseCase);
  private readonly getSaleDetailsUseCase = inject(GetSaleDetailsUseCase);
  private readonly createSaleDetailUseCase = inject(CreateSaleDetailUseCase);
  private readonly updateSaleDetailUseCase = inject(UpdateSaleDetailUseCase);
  private readonly deleteSaleDetailUseCase = inject(DeleteSaleDetailUseCase);
  private readonly getPaymentMethodsUseCase = inject(GetPaymentMethodsUseCase);
  private readonly logger = inject(LOGGER_PORT).withContext('SalesFacade');

  private readonly _sales = signal<readonly Sale[]>([]);
  private readonly _saleDetails = signal<readonly SaleDetail[]>([]);
  private readonly _paymentMethods = signal<readonly PaymentMethod[]>([]);
  private readonly _isLoadingSales = signal(false);
  private readonly _isCreatingSale = signal(false);
  private readonly _isLoadingSaleDetails = signal(false);
  private readonly _paymentMethodsLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly sales = this._sales.asReadonly();
  readonly saleDetails = this._saleDetails.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly isLoadingSales = this._isLoadingSales.asReadonly();
  readonly isCreatingSale = this._isCreatingSale.asReadonly();
  readonly isLoadingSaleDetails = this._isLoadingSaleDetails.asReadonly();
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

  createSale(payload: CreateSalePayload) {
    this._isCreatingSale.set(true);
    return this.createSaleUseCase.execute(payload).pipe(
      finalize(() => {
        this._isCreatingSale.set(false);
      })
    );
  }

  createCompleteSale(payload: CreateCompleteSalePayload) {
    this._isCreatingSale.set(true);
    return this.createCompleteSaleUseCase.execute(payload).pipe(
      finalize(() => {
        this._isCreatingSale.set(false);
      })
    );
  }

  getSaleDetail(id: number) {
    return this.getSaleDetailUseCase.execute(id);
  }

  loadSaleDetails(): void {
    this._isLoadingSaleDetails.set(true);
    this._errorMessage.set(null);
    this.getSaleDetailsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load sale details', { message });
          return of([]);
        }),
        finalize(() => this._isLoadingSaleDetails.set(false))
      )
      .subscribe((details: SaleDetail[]) => this._saleDetails.set(details));
  }

  createSaleDetail(payload: CreateSaleDetailPayload) {
    return this.createSaleDetailUseCase.execute(payload);
  }

  updateSaleDetail(id: number, payload: UpdateSaleDetailPayload) {
    return this.updateSaleDetailUseCase.execute(id, payload);
  }

  deleteSaleDetail(id: number) {
    return this.deleteSaleDetailUseCase.execute(id);
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
