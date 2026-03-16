import { Routes } from '@angular/router';

import { PaymentMethodRepository } from './domain/repository/payment-method-repository';
import { SaleRepository } from './domain/repository/sale-repository';
import { PaymentMethodRepositoryImpl } from './infrastructure/repositories/payment-method-repository.impl';
import { SaleRepositoryImpl } from './infrastructure/repositories/sale-repository.impl';
import { ProductTypeRepository } from './product-types/domain/repository/product-type-repository';
import { ProductTypeRepositoryImpl } from './product-types/infrastructure/repositories/product-type-repository.impl';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: SaleRepository, useClass: SaleRepositoryImpl },
      { provide: PaymentMethodRepository, useClass: PaymentMethodRepositoryImpl },
      { provide: ProductTypeRepository, useClass: ProductTypeRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/sales/sales.page').then((m) => m.SalesPageComponent),
  },
];
