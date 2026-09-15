import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetBranchesUseCase } from '../usecase/get-branches.usecase';
import { CreateBranchUseCase } from '../usecase/create-branch.usecase';
import { UpdateBranchUseCase } from '../usecase/update-branch.usecase';
import { DeleteBranchUseCase } from '../usecase/delete-branch.usecase';
import { Branch } from '../../domain/entities/branch.entity';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '../../domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class BranchesFacade {
  private readonly getBranchesUseCase = inject(GetBranchesUseCase);
  private readonly createBranchUseCase = inject(CreateBranchUseCase);
  private readonly updateBranchUseCase = inject(UpdateBranchUseCase);
  private readonly deleteBranchUseCase = inject(DeleteBranchUseCase);
  private readonly logger = inject(LoggerService).withContext('BranchesFacade');

  private readonly _branches = signal<readonly Branch[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly branches = this._branches.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadBranches(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getBranchesUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load branches', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((branches) => {
        this._branches.set(branches);
      });
  }

  createBranch(payload: CreateBranchPayload): Observable<Branch> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.createBranchUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to create branch', { message, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  updateBranch(id: number, payload: UpdateBranchPayload): Observable<Branch> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.updateBranchUseCase.execute(id, payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to update branch', { message, id, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  deleteBranch(id: number): Observable<void> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.deleteBranchUseCase.execute(id).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to delete branch', { message, id });
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
