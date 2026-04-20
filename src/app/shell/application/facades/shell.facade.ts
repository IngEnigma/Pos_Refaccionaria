import { computed, inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AppRoutes } from "@app/app-routes";
import { GlobalSearchService } from "@core/search/global-search.service";
import { SIDEBAR_NAV_ITEMS } from "@shell/config/sidebar-menu.config";
import { DEFAULT_SIDEBAR_NAV_ITEMS } from "@shell/config/sidebar-menu.defaults";
import { SHELL_USER_ROLE } from "@shell/config/shell-user-role.token";
import {
    SHELL_IS_AUTHENTICATED,
    SHELL_LOGOUT,
    SHELL_USERNAME
} from "@shell/config/shell-auth.token";
import { filterSidebarItems } from "@shell/utils/sidebar-filter.utils";
import { NotificationPort } from "@shell/application/ports/notification.port";
import { SidebarNavItem } from "@shell/models/sidebar-nav-item.model";

@Injectable({
    providedIn: 'root'
})
export class ShellFacade {
    private readonly globalSearchService = inject(GlobalSearchService);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationPort);
    private readonly shellUsername =
        inject(SHELL_USERNAME, { optional: true }) ?? computed(() => null);
    private readonly shellIsAuthenticated =
        inject(SHELL_IS_AUTHENTICATED, { optional: true }) ?? computed(() => false);
    private readonly shellLogout = inject(SHELL_LOGOUT, { optional: true }) ?? (() => {});
    private readonly sidebarNavItemGroups: ReadonlyArray<ReadonlyArray<SidebarNavItem>> =
        inject(SIDEBAR_NAV_ITEMS, { optional: true }) ?? [DEFAULT_SIDEBAR_NAV_ITEMS];
    private readonly shellUserRole =
        inject(SHELL_USER_ROLE, { optional: true }) ?? computed(() => null);

    readonly user = computed(() => this.shellUsername() ?? 'Desconocido');
    readonly role = this.shellUserRole;
    readonly isAuthenticated = this.shellIsAuthenticated;

    readonly filteredSidebarItems = computed(() => {
        const role = this.shellUserRole();
        return filterSidebarItems(this.sidebarNavItemGroups.flat(), role);
    });

    readonly notifications = this.notificationService.notifications;

    logout(): void {
        this.shellLogout();
        void this.router.navigate([AppRoutes.login]);
    }

    handleProfileMenuAction(action: string): void {
        if (action.startsWith('/')) {
            void this.router.navigate([action]);
        }
    }

    setSearchQuery(query: string): void {
        this.globalSearchService.setSearchQuery(query);
    }

}
