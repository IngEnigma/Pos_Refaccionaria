import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: 'cashiers',
    loadComponent: () =>
      import('./presentation/pages/cashiers-management/cashiers-management.page').then(
        (m) => m.CashiersManagementPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cashiers',
  },
];
