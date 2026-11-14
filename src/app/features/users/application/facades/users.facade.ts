import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { CreateUserUseCase } from '@features/users/application/usecase/create-user.usecase';
import { GetUsersUseCase } from '@features/users/application/usecase/get-users.usecase';
import { User } from '@features/users/domain/entities/user.entity';
import { CreateUserPayload } from '@features/users/domain/repository/user-repository';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly getUsersUseCase = inject(GetUsersUseCase);
  private readonly createUserUseCase = inject(CreateUserUseCase);
  private readonly logger = inject(LoggerService).withContext('UsersFacade');

  private readonly _users = signal<readonly User[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadUsers(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getUsersUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          this.fail('Failed to load users', error);
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((users) => this._users.set(users));
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.createUserUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        this.fail('Failed to create user', error);
        throw error;
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private fail(context: string, error: unknown): void {
    // H-48: el backend responde {"error"} / {"detail"}; HttpErrorResponse no es un Error.
    const body = error instanceof HttpErrorResponse ? error.error : null;
    const message =
      body?.error || body?.detail || body?.message || (error instanceof Error && error.message) || 'Ocurrió un error inesperado.';
    this._errorMessage.set(message);
    // Sin payload en el log: lleva la contraseña.
    this.logger.error(context, { message });
  }
}
