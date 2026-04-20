import { inject, Injectable } from '@angular/core';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { LoginCommand } from '@features/auth/application/commands/login.command';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly logger = inject(LOGGER_PORT).withContext('LoginUseCase');
  private readonly sessionService = inject(SessionStateService);

  execute(command: LoginCommand): Observable<Session> {
    const { remember, ...credentials } = command;

    return this.authRepository.login(credentials).pipe(
      tap((session) => {
        this.sessionService.setSession(session, { persist: true, remember });
        this.logger.info('User logged in successfully', { userId: session.userId });
      }),
      catchError((error: unknown) => {
        this.logger.error('Login failed', error);
        return throwError(() => error);
      }),
    );
  }
}
