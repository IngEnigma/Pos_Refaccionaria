import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { LoginCredentials } from '@features/auth/domain/repository/auth-repository';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly logger = inject(LoggerService).withContext('AuthFacade');

  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  login(credentials: LoginCredentials): Observable<boolean> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.loginUseCase.execute(credentials).pipe(
      map(() => true),
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.warn('Login rejected', { message });
        return of(false);
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        this.extractMessage(error.error) ??
        error.message ??
        'Error de autenticación'
      );
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Error de autenticación';
  }

  private extractMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if ('detail' in payload && typeof payload.detail === 'string') {
      return payload.detail;
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message;
    }

    return null;
  }
}
