import { Routes } from '@angular/router';

import { AppRoutes } from '@app/app-routes';
import { authGuard } from '@features/auth/presentation/guards/auth.guard';
import { MainLayoutComponent } from '@app/shell/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: AppRoutes.login,
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: AppRoutes.sales,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/sales/sales.routes').then((m) => m.SALES_ROUTES),
  },
  {
    path: AppRoutes.inventory,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
  },
  {
    path: AppRoutes.reports,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: AppRoutes.history,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/sales-history/sales-history.routes').then(
        (m) => m.SALES_HISTORY_ROUTES,
      ),
  },
  {
    path: AppRoutes.suppliers,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/suppliers/suppliers.routes').then((m) => m.SUPPLIERS_ROUTES),
  },
  {
    path: AppRoutes.branches,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/branches/branches.routes').then((m) => m.BRANCHES_ROUTES),
  },
  {
    path: AppRoutes.clients,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
  },
  {
    path: AppRoutes.admin,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: AppRoutes.manager,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
  },
  {
    path: AppRoutes.notifications,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES),
  },
  {
    path: AppRoutes.branchPricing,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/branch-pricing/branch-pricing.routes').then(
        (m) => m.BRANCH_PRICING_ROUTES,
      ),
  },
  {
    path: AppRoutes.inventoryByBranch,
    canActivate: [authGuard],
    component: MainLayoutComponent,
    loadChildren: () =>
      import('@features/inventory-by-branch/inventory-by-branch.routes').then(
        (m) => m.INVENTORY_BY_BRANCH_ROUTES,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: AppRoutes.login,
  },
  {
    path: '**',
    redirectTo: AppRoutes.login,
  },
];
