import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { RefreshTokenUseCase } from '@features/auth/application/usecase/refresh.usecase';
import {
  isRefreshRequest,
  withBearerToken,
} from '@features/auth/infrastructure/http/auth-token-http.utils';

@Injectable({ providedIn: 'root' })
export class AuthTokenRefreshOrchestrator {
  private readonly sessionService = inject(SessionStateService);
  private readonly refreshTokenUseCase = inject(RefreshTokenUseCase);
  private readonly apiOrigin = new URL(inject<Environment>(APP_ENV).apiUrl).origin;
  private readonly logger = inject(LOGGER_PORT).withContext(
    'AuthTokenRefreshOrchestrator',
  );

  private refreshInFlight$: Observable<string> | null = null;

  attachAccessToken(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const accessToken = this.sessionService.getSession()?.accessToken;
    // El token solo viaja a la API propia y nunca en el refresh (H-21).
    if (!accessToken || isRefreshRequest(request) || !this.isOwnApiUrl(request.url)) {
      return request;
    }

    return withBearerToken(request, accessToken);
  }

  private isOwnApiUrl(url: string): boolean {
    const isRelative = !/^([a-z][a-z\d+.-]*:)?\/\//i.test(url);
    if (isRelative) {
      return true;
    }

    try {
      return new URL(url, this.apiOrigin).origin === this.apiOrigin;
    } catch {
      return false;
    }
  }

  retryRequestAfterRefresh(
    request: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    if (!this.hasRefreshToken()) {
      this.logger.error('No refresh token available, clearing session');
      this.sessionService.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.getOrCreateRefreshFlow().pipe(
      switchMap((accessToken) => next(withBearerToken(request, accessToken))),
    );
  }

  private hasRefreshToken(): boolean {
    return Boolean(this.sessionService.getSession()?.refreshToken);
  }

  private getOrCreateRefreshFlow(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.logger.info('Refreshing access token');

    this.refreshInFlight$ = this.refreshTokenUseCase.execute().pipe(
      map((session) => session.accessToken),
      catchError((error: unknown) => {
        this.logger.error('Failed to refresh access token', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.refreshInFlight$;
  }
}
