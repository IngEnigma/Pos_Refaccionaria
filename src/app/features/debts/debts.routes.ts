import { Routes } from '@angular/router';

export const DEBTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/debts.page').then((m) => m.DebtsPageComponent),
  },
];
