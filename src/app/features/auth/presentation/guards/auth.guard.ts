import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { AppRoutes } from '@app/app-routes';
import { SessionStateService } from '@features/auth/application/services/session-state.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const sessionService = inject(SessionStateService);
  const router = inject(Router);
  const logger = inject(LOGGER_PORT).withContext('AuthGuard');

  const isLogged = sessionService.isAuthenticated();

  if (!isLogged) {
    logger.warn('User is not authenticated, redirecting to login', {
      url: state.url,
    });

    return router.createUrlTree([AppRoutes.login], {
      queryParams: { redirectTo: state.url },
    });
  }

  logger.debug('User is authenticated, allowing access', { url: state.url });
  return true;
};
