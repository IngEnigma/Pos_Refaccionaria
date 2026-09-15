import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/notifications-page/notifications.page').then(
        (m) => m.NotificationsPageComponent,
      ),
  },
];
