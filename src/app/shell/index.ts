export { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
export type { NotificationItem } from './models/notification.model';
export type { SidebarNavItem } from './models/sidebar-nav-item.model';
export type { ShellRole } from './models/shell-role.model';
export { ShellFacade } from './application/facades/shell.facade';
export { SIDEBAR_NAV_ITEMS, provideSidebarNavItems } from './config/sidebar-menu.config';
export {
  SHELL_USERNAME,
  SHELL_IS_AUTHENTICATED,
  SHELL_LOGOUT,
} from './config/shell-auth.token';
export { SHELL_USER_ROLE } from './config/shell-user-role.token';
