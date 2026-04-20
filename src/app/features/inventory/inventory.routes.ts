import { Routes } from '@angular/router';

import { ProductRepository } from './domain/repository/product-repository';
import { ProductRepositoryImpl } from './infrastructure/repositories/product-repository.impl';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: ProductRepository, useClass: ProductRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/inventory/inventory.page').then(
        (m) => m.InventoryPageComponent,
      ),
  },
];
