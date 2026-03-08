import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/sales/sales.page').then((m) => m.SalesPageComponent),
  },
];
