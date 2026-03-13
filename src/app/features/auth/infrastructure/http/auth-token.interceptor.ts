import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import {
  isRefreshRequest,
  isUnauthorizedError,
} from './auth-token-http.utils';
import { AuthTokenRefreshOrchestrator } from './auth-token-refresh-orchestrator.service';

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
