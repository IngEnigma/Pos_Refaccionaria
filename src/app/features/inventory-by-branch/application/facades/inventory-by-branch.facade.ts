import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of, tap } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetMyBranchInventoryUseCase } from '../usecase/get-my-branch-inventory.usecase';
import { GetMovementsUseCase } from '../usecase/get-movements.usecase';
import { RegisterMovementUseCase } from '../usecase/register-movement.usecase';
import { BranchInventory } from '../../domain/entities/inventory.entity';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryMovement, RegisterMovementPayload } from '../../domain/entities/inventory-movement.entity';

@Injectable({ providedIn: 'root' })
export class InventoryByBranchFacade {
  private readonly getMyBranchInventoryUseCase = inject(GetMyBranchInventoryUseCase);
  private readonly getMovementsUseCase = inject(GetMovementsUseCase);
  private readonly registerMovementUseCase = inject(RegisterMovementUseCase);
  private readonly logger = inject(LoggerService).withContext('InventoryByBranchFacade');

  private readonly _inventory = signal<BranchInventory[]>([]);
  private readonly _allItems = signal<readonly InventoryItem[]>([]);
  private readonly _selectedInventory = signal<BranchInventory | null>(null);
  private readonly _movements = signal<readonly InventoryMovement[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly inventory = this._inventory.asReadonly();
  readonly allItems = this._allItems.asReadonly();
  readonly selectedInventory = this._selectedInventory.asReadonly();
  readonly movements = this._movements.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadMyBranchInventory(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getMyBranchInventoryUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load branch inventory', { message });
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((inventories) => {
        this._inventory.set(inventories);
        const allItems = inventories.flatMap((inv) => inv.detalles);
        this._allItems.set(allItems);
        if (inventories.length > 0 && !this._selectedInventory()) {
          this._selectedInventory.set(inventories[0]);
        }
      });
  }

  selectInventory(inventario: BranchInventory): void {
    this._selectedInventory.set(inventario);
  }

  loadMovements(): void {
    this.getMovementsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this.logger.warn('Failed to load movements', { message });
          return of([]);
        }),
      )
      .subscribe((movements) => {
        this._movements.set(movements);
      });
  }

  registerMovement(payload: RegisterMovementPayload): Observable<unknown> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.registerMovementUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to register movement', { message, payload });
        throw error;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  refreshAll(): void {
    this.loadMyBranchInventory();
    this.loadMovements();
  }

  clearError(): void {
    this._errorMessage.set(null);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.error || error.error?.message || error.message;
      return backendMessage || 'No fue posible completar la operación.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }
}
