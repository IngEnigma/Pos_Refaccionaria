import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LoggerService } from '@core/logging/logger.service';
import { AppRoutes } from '@core/routing/app-routes';
import { SessionService } from '@core/services/session-state.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const logger = inject(LoggerService).withContext('AuthGuard');

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
