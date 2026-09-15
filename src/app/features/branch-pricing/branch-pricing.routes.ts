import { Routes } from '@angular/router';

import { BranchPriceRepository } from './domain/repository/branch-price-repository';
import { BranchPriceRepositoryImpl } from './infrastructure/repositories/branch-price-repository.impl';

export const BRANCH_PRICING_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: BranchPriceRepository, useClass: BranchPriceRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/branch-pricing-page/branch-pricing.page').then(
        (m) => m.BranchPricingPageComponent,
      ),
  },
];
