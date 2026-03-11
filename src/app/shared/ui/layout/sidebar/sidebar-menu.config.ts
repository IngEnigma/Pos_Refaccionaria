import { SidebarNavItem } from './sidebar-nav-item.model';

export const DEFAULT_SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'sales', label: 'Menú', iconPath: 'assets/icons/menu.svg', route: '/sales', exact: true },
  { id: 'history', label: 'Historial', iconPath: 'assets/icons/history.svg', route: '/record', disabled: false },
  { id: 'reports', label: 'Reportes', iconPath: 'assets/icons/factura.svg', route: '/reports', disabled: false },
  { id: 'inventory', label: 'Inventario', iconPath: 'assets/icons/inventory.svg', route: '/inventory', disabled: false },
  { id: 'refunds', label: 'Devoluciones', iconPath: 'assets/icons/refounds.svg', route: '/refounds', disabled: false },
  { id: 'clients', label: 'Clientes', iconPath: 'assets/icons/clients.svg', route: '/clients', disabled: false },
];
