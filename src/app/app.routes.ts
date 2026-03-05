import { Routes } from '@angular/router';

import { AppRoutes } from '@core/routing/app-routes';

export const routes: Routes = [
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: AppRoutes.login,
  },
  {
    path: '**',
    redirectTo: AppRoutes.login,
  },
];
