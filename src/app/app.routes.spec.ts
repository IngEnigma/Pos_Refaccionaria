import { AppRoutes } from '@app/app-routes';
import { authGuard } from '@features/auth/presentation/guards/auth.guard';
import { roleGuard } from '@features/auth/presentation/guards/role.guard';
import { routes } from './app.routes';

// H-01: control de acceso por rol declarado en la tabla de rutas.
describe('app.routes — acceso por rol', () => {
  const find = (path: string) => routes.find((r) => r.path === path)!;

  it.each([
    [AppRoutes.admin, ['admin']],
    [AppRoutes.branches, ['admin']],
    [AppRoutes.branchPricing, ['admin']],
    [AppRoutes.manager, ['admin', 'manager']],
    [AppRoutes.inventoryByBranch, ['admin', 'manager']],
    [AppRoutes.reports, ['admin', 'manager']], // H-F4-3: el back da 403 al cajero (reporte.ver)
  ])('/%s exige authGuard + roleGuard con roles %j', (path, roles) => {
    const route = find(path);

    expect(route.canActivate).toEqual([authGuard, roleGuard]);
    expect(route.data?.['roles']).toEqual(roles);
  });

  it('/sales no restringe por rol (cualquier usuario autenticado)', () => {
    expect(find(AppRoutes.sales).data?.['roles']).toBeUndefined();
  });
});
