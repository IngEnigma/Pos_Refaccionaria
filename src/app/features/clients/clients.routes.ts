import { Routes } from '@angular/router';

// ClientRepository se provee en app.config.ts (raíz) para que el catálogo
// de clientes también esté disponible fuera de esta ruta (p. ej. Ventas).
export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/clients-page/clients.page').then(
        (m) => m.ClientsPageComponent,
      ),
  },
];
