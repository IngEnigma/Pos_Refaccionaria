import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { JwtUtils } from '@core/utils/jwt.utils';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';

@Injectable({ providedIn: 'root' })
export class RefreshTokenUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly sessionService = inject(SessionStateService);
  private readonly logger = inject(LOGGER_PORT).withContext('RefreshTokenUseCase');

  execute(): Observable<Session> {
    const currentSession = this.sessionService.getSession();

    if (!currentSession?.refreshToken || currentSession.isRefreshTokenExpired()) {
      this.logger.warn('No refresh token available');
      this.sessionService.clearSession();
      return throwError(() => new Error('Session expired. Refresh token unavailable.'));
    }

    return this.authRepository.refresh(currentSession.refreshToken).pipe(
      map((newAccessToken: string) => {
        const accessExp = JwtUtils.decodeExpiration(newAccessToken);
        return currentSession.updateAccessToken(newAccessToken, accessExp);
      }),
      tap((updatedSession) => {
        this.sessionService.setSession(updatedSession, { persist: true });
        this.logger.info('Access token refreshed successfully');
      }),
      catchError((error: unknown) => {
        this.logger.error('Refresh token failed', error);
        this.sessionService.clearSession();
        return throwError(() => error);
      }),
    );
  }
}
