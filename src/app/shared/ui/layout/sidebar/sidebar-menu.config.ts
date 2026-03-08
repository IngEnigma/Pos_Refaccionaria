import { SidebarNavItem } from './sidebar-nav-item.model';

export const DEFAULT_SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'sales', label: 'Menú', iconPath: 'assets/icons/menu.svg', route: '/sales', exact: true },
  { id: 'history', label: 'Historial', iconPath: 'assets/icons/history.svg', route: '/record', disabled: true },
  { id: 'reports', label: 'Reportes', iconPath: 'assets/icons/factura.svg', route: '/reports', disabled: true },
  { id: 'inventory', label: 'Inventario', iconPath: 'assets/icons/inventory.svg', route: '/inventory', disabled: true },
  { id: 'refunds', label: 'Devoluciones', iconPath: 'assets/icons/refounds.svg', route: '/refounds', disabled: true },
  { id: 'clients', label: 'Clientes', iconPath: 'assets/icons/clients.svg', route: '/clients', disabled: true },
];
