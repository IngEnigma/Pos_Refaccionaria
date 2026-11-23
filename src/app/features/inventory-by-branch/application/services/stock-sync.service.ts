import { inject, Injectable, OnDestroy } from '@angular/core';
import { catchError, EMPTY, exhaustMap, interval, startWith, Subscription, tap, timeout } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryByBranchFacade } from '../facades/inventory-by-branch.facade';
import { GetStockUseCase } from '../usecase/get-stock.usecase';

const STOCK_POLL_INTERVAL_MS = 5_000;
const STOCK_REQUEST_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class StockSyncService implements OnDestroy {
  private readonly auth = inject(AuthFacade);
  private readonly getStock = inject(GetStockUseCase);
  private readonly inventory = inject(InventoryByBranchFacade);

  private started = false;
  private activeBranchId: number | null = null;
  private subscription?: Subscription;

  start(): void {
    const branchId = this.auth.sucursalId();

    if (this.started && branchId === this.activeBranchId) return;

    this.activeBranchId = branchId;

    if (!this.started) {
      this.started = true;
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }

    // Al cambiar de sucursal se cancela la petición anterior y se consulta de inmediato.
    this.stopTimer();
    if (branchId != null && !document.hidden) this.startTimer();
  }

  stop(): void {
    this.started = false;
    this.activeBranchId = null;
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private startTimer(): void {
    this.subscription = interval(STOCK_POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        exhaustMap(() => {
          const sucursalId = this.auth.sucursalId();
          if (sucursalId == null) return EMPTY;

          return this.getStock.execute(sucursalId).pipe(
            timeout(STOCK_REQUEST_TIMEOUT_MS),
            tap((stock) => {
              // Una respuesta de una sucursal anterior no debe pisar la actual.
              if (this.auth.sucursalId() === sucursalId) {
                this.inventory.applyStockSnapshot(stock);
              }
            }),
            catchError(() => EMPTY),
          );
        }),
      )
      .subscribe();
  }

  private stopTimer(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  private readonly onVisibilityChange = (): void => {
    if (!this.started) return;

    if (document.hidden) {
      this.stopTimer();
      return;
    }

    if (!this.subscription) this.startTimer();
  };
}
