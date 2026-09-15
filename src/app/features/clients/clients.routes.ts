import { Routes } from '@angular/router';

import { ClientRepository } from './domain/repository/client-repository';
import { ClientRepositoryImpl } from './infrastructure/repositories/client-repository.impl';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: ClientRepository, useClass: ClientRepositoryImpl },
    ],
    loadComponent: () =>
      import('./presentation/pages/clients-page/clients.page').then(
        (m) => m.ClientsPageComponent,
      ),
  },
];
