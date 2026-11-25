import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { Client } from '@features/clients/domain/entities/client.entity';
import { GetClientsUseCase } from '@features/clients/application/usecase/get-clients.usecase';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { CreateDebtPayload, Debt, DebtPayment, DebtStatus } from '../../domain/debt';
import { AddDebtPaymentUseCase } from '../usecase/add-debt-payment.usecase';
import { CancelDebtUseCase } from '../usecase/cancel-debt.usecase';
import { CreateDebtUseCase } from '../usecase/create-debt.usecase';
import { GetDebtsUseCase } from '../usecase/get-debts.usecase';

@Injectable({ providedIn: 'root' })
export class DebtsFacade {
  private readonly getDebtsUseCase = inject(GetDebtsUseCase);
  private readonly createDebtUseCase = inject(CreateDebtUseCase);
  private readonly cancelDebtUseCase = inject(CancelDebtUseCase);
  private readonly addPaymentUseCase = inject(AddDebtPaymentUseCase);
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly getMethodsUseCase = inject(GetPaymentMethodsUseCase);
  private readonly logger = inject(LoggerService).withContext('DebtsFacade');

  private readonly _debts = signal<readonly Debt[]>([]);
  private readonly _clients = signal<readonly Client[]>([]);
  private readonly _methods = signal<readonly PaymentMethod[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly debts = this._debts.asReadonly();
  readonly clients = this._clients.asReadonly();
  readonly methods = this._methods.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  /** Catálogos para los diálogos (clientes y métodos de pago). */
  loadCatalogs(): void {
    this.getClientsUseCase.execute().pipe(catchError((e) => this.recover(e, 'clients', []))).subscribe((c) => this._clients.set(c));
    this.getMethodsUseCase.execute().pipe(catchError((e) => this.recover(e, 'payment methods', []))).subscribe((m) => this._methods.set(m));
  }

  loadDebts(status?: DebtStatus): void {
    this._loading.set(true);
    this._errorMessage.set(null);
    this.getDebtsUseCase
      .execute(status)
      .pipe(catchError((e) => this.recover(e, 'debts', [])), finalize(() => this._loading.set(false)))
      .subscribe((d) => this._debts.set(d));
  }

  createDebt(payload: CreateDebtPayload): Observable<Debt> {
    return this.mutate(this.createDebtUseCase.execute(payload), 'create debt');
  }

  addPayment(debtId: number, amount: number, paymentMethodId: number | null): Observable<DebtPayment> {
    return this.mutate(this.addPaymentUseCase.execute(debtId, amount, paymentMethodId), 'add payment');
  }

  cancelDebt(id: number): Observable<void> {
    return this.mutate(this.cancelDebtUseCase.execute(id), 'cancel debt');
  }

  private mutate<T>(op: Observable<T>, what: string): Observable<T> {
    this._loading.set(true);
    this._errorMessage.set(null);
    return op.pipe(
      tap({ error: (e) => this.setError(e, what) }),
      finalize(() => this._loading.set(false)),
    );
  }

  private recover<T>(error: unknown, what: string, fallback: T): Observable<T> {
    this.setError(error, what);
    return of(fallback);
  }

  private setError(error: unknown, what: string): void {
    const message = this.resolveErrorMessage(error);
    this._errorMessage.set(message);
    this.logger.error(`Failed: ${what}`, { message });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.error || error.error?.message || error.message || 'No fue posible completar la operación.';
    }
    return error instanceof Error && error.message ? error.message : 'Ocurrió un error inesperado.';
  }
}
