import { SidebarNavItem } from '../models/sidebar-nav-item.model';
import { ShellRole } from '../models/shell-role.model';

export function filterSidebarItems(
  items: readonly SidebarNavItem[],
  userRole: ShellRole | null
): SidebarNavItem[] {
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return userRole !== null && item.roles.includes(userRole);
  });
}
