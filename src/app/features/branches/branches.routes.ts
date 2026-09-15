import { Routes } from '@angular/router';

import { BranchRepository } from './domain/repository/branch-repository';
import { BranchRepositoryImpl } from './infrastructure/repositories/branch-repository.impl';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: BranchRepository, useClass: BranchRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/branches-page/branches.page').then(
        (m) => m.BranchesPageComponent,
      ),
  },
];
