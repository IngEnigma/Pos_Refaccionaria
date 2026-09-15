import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/admin-management/admin-management.page').then(
        (m) => m.AdminManagementPageComponent,
      ),
  },
];
