import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetSuppliersUseCase } from '../usecase/get-suppliers.usecase';
import { CreateSupplierUseCase } from '../usecase/create-supplier.usecase';
import { UpdateSupplierUseCase } from '../usecase/update-supplier.usecase';
import { DeleteSupplierUseCase } from '../usecase/delete-supplier.usecase';
import { Supplier } from '../../domain/entities/supplier.entity';
import {
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '../../domain/repository/supplier-repository';

@Injectable({ providedIn: 'root' })
export class SuppliersFacade {
  private readonly getSuppliersUseCase = inject(GetSuppliersUseCase);
  private readonly createSupplierUseCase = inject(CreateSupplierUseCase);
  private readonly updateSupplierUseCase = inject(UpdateSupplierUseCase);
  private readonly deleteSupplierUseCase = inject(DeleteSupplierUseCase);
  private readonly logger = inject(LoggerService).withContext('SuppliersFacade');

  private readonly _suppliers = signal<readonly Supplier[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly suppliers = this._suppliers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadSuppliers(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getSuppliersUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load suppliers', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((suppliers) => {
        this._suppliers.set(suppliers);
      });
  }

  createSupplier(payload: CreateSupplierPayload): Observable<Supplier> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.createSupplierUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to create supplier', { message, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  updateSupplier(id: number, payload: UpdateSupplierPayload): Observable<Supplier> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.updateSupplierUseCase.execute(id, payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to update supplier', { message, id, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  deleteSupplier(id: number): Observable<void> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.deleteSupplierUseCase.execute(id).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to delete supplier', { message, id });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || 'No fue posible completar la operación.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }
}
