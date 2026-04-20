import { Routes } from '@angular/router';

import { SupplierRepository } from './domain/repository/supplier-repository';
import { SupplierRepositoryImpl } from './infrastructure/repositories/supplier-repository.impl';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: SupplierRepository, useClass: SupplierRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/suppliers/suppliers.page').then(
        (m) => m.SuppliersPageComponent,
      ),
  },
];
