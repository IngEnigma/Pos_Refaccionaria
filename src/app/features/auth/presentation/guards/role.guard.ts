import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { AppRoutes } from '@app/app-routes';
import { SessionStateService } from '@features/auth/application/services/session-state.service';

/** Restringe una ruta a los roles de `route.data['roles']`. Sin `data.roles` deja pasar. */
export const roleGuard: CanActivateFn = (route, state) => {
  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  if (!allowedRoles?.length) return true;

  const sessionService = inject(SessionStateService);
  const router = inject(Router);
  const logger = inject(LOGGER_PORT).withContext('RoleGuard');
  const role = sessionService.role();

  if (!role) {
    return router.createUrlTree([AppRoutes.login], {
      queryParams: { redirectTo: state.url },
    });
  }

  if (!allowedRoles.includes(role)) {
    logger.warn('Role not allowed, redirecting to sales', { url: state.url, role });
    return router.createUrlTree([AppRoutes.sales]);
  }

  return true;
};
