import { InjectionToken, Provider } from '@angular/core';
import { SidebarNavItem } from '@shell/models/sidebar-nav-item.model';

export const SIDEBAR_NAV_ITEMS = new InjectionToken<
  ReadonlyArray<ReadonlyArray<SidebarNavItem>>
>('SIDEBAR_NAV_ITEMS');

export function provideSidebarNavItems(
  items: ReadonlyArray<SidebarNavItem>,
): Provider {
  return {
    provide: SIDEBAR_NAV_ITEMS,
    useValue: items,
    multi: true,
  };
}
