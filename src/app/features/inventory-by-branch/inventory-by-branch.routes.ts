import { Routes } from '@angular/router';

import { InventoryRepository } from './domain/repository/inventory-repository';
import { InventoryRepositoryImpl } from './infrastructure/repositories/inventory-repository.impl';
import { InventoryMovementRepository } from './domain/repository/movement-repository';
import { InventoryMovementRepositoryImpl } from './infrastructure/repositories/movement-repository.impl';

export const INVENTORY_BY_BRANCH_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: InventoryRepository, useClass: InventoryRepositoryImpl },
      { provide: InventoryMovementRepository, useClass: InventoryMovementRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/inventory-page/inventory.page').then(
        (m) => m.InventoryByBranchPageComponent,
      ),
  },
];
