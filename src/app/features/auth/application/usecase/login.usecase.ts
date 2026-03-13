import { inject, Injectable } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import {
  AuthRepository,
  LoginCredentials,
} from '@features/auth/domain/repository/auth-repository';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly logger = inject(LoggerService).withContext('LoginUseCase');
  private readonly sessionService = inject(SessionStateService);

  execute(credentials: LoginCredentials): Observable<Session> {
    return this.authRepository.login(credentials).pipe(
      tap((session) => {
        this.sessionService.setSession(session, { persist: true });
        this.logger.info('User logged in successfully', { userId: session.userId });
      }),
      catchError((error: unknown) => {
        this.logger.error('Login failed', error);
        return throwError(() => error);
      }),
    );
  }
}
