import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/reports-page/reports.page').then(
        (m) => m.ReportsPageComponent,
      ),
  },
];
