import { Routes } from '@angular/router';

import { AppRoutes } from '@core/routing/app-routes';
import { authGuard } from '@core/guards/auth.guard';
import { MainLayoutComponent } from '@app/shared/ui/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: AppRoutes.sales,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/sales/sales.routes').then((m) => m.SALES_ROUTES),
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
