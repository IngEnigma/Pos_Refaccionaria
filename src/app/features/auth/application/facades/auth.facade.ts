import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of } from 'rxjs';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { LoginCommand } from '@features/auth/application/commands/login.command';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import {
  AuthError,
  InvalidCredentialsError,
  NetworkAuthError,
} from '@features/auth/domain/errors/auth.errors';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly sessionState = inject(SessionStateService);
  private readonly logger = inject(LOGGER_PORT).withContext('AuthFacade');

  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly username = this.sessionState.username;
  readonly role = this.sessionState.role;
  readonly isAuthenticated = this.sessionState.isAuthenticated;

  login(command: LoginCommand): Observable<boolean> {
    this._loading.set(true);
      this._errorMessage.set(null);

    return this.loginUseCase.execute(command).pipe(
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

  logout(): void {
    this.sessionState.clearSession();
    this.logger.info('User logged out');
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof InvalidCredentialsError) {
      return 'Credenciales inválidas';
    }
    if (error instanceof NetworkAuthError) {
      return 'Error de red. Verifica tu conexión.';
    }
    if (error instanceof AuthError) {
      return error.message;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Error de autenticación';
  }
}
