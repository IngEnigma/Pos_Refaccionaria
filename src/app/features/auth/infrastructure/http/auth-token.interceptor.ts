import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { LOGGER_PORT } from '@core/logging/logger.port';
import {
  isRefreshRequest,
  isUnauthorizedError,
} from '@features/auth/application/services/auth-token-http.utils';
import { AuthTokenRefreshOrchestrator } from '@features/auth/application/services/auth-token-refresh-orchestrator.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LOGGER_PORT).withContext('AuthTokenInterceptor');
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

      // Sin token adjunto (sin sesión, login incorrecto, host externo) no hay nada que renovar:
      // el 401 original llega intacto al llamador (H-22).
      if (!authRequest.headers.has('Authorization')) {
        return throwError(() => error);
      }

      logger.warn('401 Unauthorized error intercepted, attempting token refresh');
      return refreshOrchestrator.retryRequestAfterRefresh(authRequest, next);
    }),
  );
};
