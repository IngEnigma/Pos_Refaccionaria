import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { BranchPrice } from '../../domain/entities/branch-price.entity';
import { PriceHistoryItem } from '../../domain/entities/price-history-item.entity';
import { SetBranchPricePayload } from '../../domain/repository/branch-price-repository';
import { GetActivePriceUseCase } from '../usecase/get-active-price.usecase';
import { GetPriceHistoryUseCase } from '../usecase/get-price-history.usecase';
import { SetBranchPriceUseCase } from '../usecase/set-branch-price.usecase';

@Injectable({ providedIn: 'root' })
export class BranchPricingFacade {
  private readonly getActivePriceUseCase = inject(GetActivePriceUseCase);
  private readonly getPriceHistoryUseCase = inject(GetPriceHistoryUseCase);
  private readonly setBranchPriceUseCase = inject(SetBranchPriceUseCase);
  private readonly logger = inject(LoggerService).withContext('BranchPricingFacade');

  private readonly _selectedSucursalId = signal<number | null>(null);
  private readonly _prices = signal<readonly BranchPrice[]>([]);
  private readonly _priceHistory = signal<readonly PriceHistoryItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _historyLoading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly selectedSucursalId = this._selectedSucursalId.asReadonly();
  readonly prices = this._prices.asReadonly();
  readonly priceHistory = this._priceHistory.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadActivePrice(idProducto: number, idSucursal: number): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getActivePriceUseCase
      .execute(idProducto, idSucursal)
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load active price', { message });
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((price) => {
        if (price) {
          const existing = this._prices().filter(
            (p) => !(p.idProducto === idProducto && p.idSucursal === idSucursal),
          );
          this._prices.set([...existing, price]);
        }
      });
  }

  loadPriceHistory(idProducto: number, idSucursal: number): void {
    this._historyLoading.set(true);
    this._errorMessage.set(null);

    this.getPriceHistoryUseCase
      .execute(idProducto, idSucursal)
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load price history', { message });
          return of([]);
        }),
        finalize(() => this._historyLoading.set(false)),
      )
      .subscribe((history) => {
        this._priceHistory.set(history);
      });
  }

  setBranchPrice(payload: SetBranchPricePayload): Observable<BranchPrice> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.setBranchPriceUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to set branch price', { message, payload });
        throw error;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  clearHistory(): void {
    this._priceHistory.set([]);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.error?.error || error.message || 'No fue posible completar la operación.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }
}
