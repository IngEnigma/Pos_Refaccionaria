import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthTokenRefreshOrchestrator } from '@core/http/auth/auth-token-refresh-orchestrator.service';
import { LoggerService } from '@core/logging/logger.service';
import {
  isRefreshRequest,
  isUnauthorizedError,
} from '@core/http/auth/auth-token-http.utils';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService).withContext('AuthTokenInterceptor');
  const refreshOrchestrator = inject(AuthTokenRefreshOrchestrator);
  const authRequest = refreshOrchestrator.attachAccessToken(req);

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorizedError(error)) {
        return throwError(() => error);
      }

      if (isRefreshRequest(authRequest)) {
        logger.warn('Refresh endpoint returned 401, aborting refresh flow');
        return throwError(() => error);
      }

      logger.warn('401 Unauthorized error intercepted, attempting token refresh');
      return refreshOrchestrator.retryRequestAfterRefresh(authRequest, next);
    }),
  );
};
