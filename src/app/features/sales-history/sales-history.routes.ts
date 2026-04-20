import { Routes } from '@angular/router';

export const SALES_HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/sales-history-page/sales-history.page').then(
        (m) => m.SalesHistoryPageComponent,
      ),
  },
];
