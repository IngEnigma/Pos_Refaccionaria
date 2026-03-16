import { SidebarNavItem } from './sidebar-nav-item.model';

export const DEFAULT_SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'sales', label: 'Menú', icon: 'house', route: '/sales', exact: true },
  // TODO: Falta definir estas rutas en app.routes.ts
  // { id: 'history', label: 'Historial', icon: 'history', route: '/record' },
  // { id: 'reports', label: 'Reportes', icon: 'file-text', route: '/reports' },
  // { id: 'inventory', label: 'Inventario', icon: 'package', route: '/inventory' },
  // { id: 'refunds', label: 'Devoluciones', icon: 'refresh-cw', route: '/refounds' },
  // { id: 'clients', label: 'Clientes', icon: 'users', route: '/clients' },
];
