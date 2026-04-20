import { Provider, Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/app-routes';
import { GlobalSearchService } from '@core/search/global-search.service';
import { NotificationPort } from '@shell/application/ports/notification.port';
import { SidebarNavItem } from '@shell/models/sidebar-nav-item.model';
import { SHELL_LOGOUT, SHELL_USERNAME } from '@shell/config/shell-auth.token';
import { SIDEBAR_NAV_ITEMS } from '@shell/config/sidebar-menu.config';
import { SHELL_USER_ROLE } from '@shell/config/shell-user-role.token';
import { ShellFacade } from './shell.facade';

describe('ShellFacade', () => {
  const searchServiceMock = {
    setSearchQuery: jest.fn(),
  };
  const routerMock = {
    navigate: jest.fn(),
  };
  const notificationServiceMock = {
    notifications: signal([] as const).asReadonly(),
  };

  function setup(extraProviders: Provider[] = []): ShellFacade {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ShellFacade,
        { provide: GlobalSearchService, useValue: searchServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: NotificationPort, useValue: notificationServiceMock },
        ...extraProviders,
      ],
    });
    return TestBed.inject(ShellFacade);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    routerMock.navigate.mockResolvedValue(true);
  });

  it('inicia con estado por defecto sin tokens inyectados', () => {
    const facade = setup();

    expect(facade.user()).toBe('Desconocido');
    expect(facade.role()).toBeNull();
    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.filteredSidebarItems()).toEqual([]);
  });

  it('usa fallback de username a "Desconocido" cuando el token retorna null', () => {
    const facade = setup([
      {
        provide: SHELL_USERNAME,
        useValue: signal<string | null>(null) as Signal<string | null>,
      },
    ]);

    expect(facade.user()).toBe('Desconocido');
  });

  it('filtra sidebar por rol', () => {
    const sidebarGroupA: readonly SidebarNavItem[] = [
      { id: 'home', label: 'Inicio', icon: 'house', route: '/home' },
      { id: 'admin', label: 'Admin', icon: 'settings', route: '/admin', roles: ['admin'] },
    ];
    const sidebarGroupB: readonly SidebarNavItem[] = [
      { id: 'seller', label: 'Ventas', icon: 'store', route: '/sales', roles: ['seller'] },
    ];

    const facade = setup([
      { provide: SIDEBAR_NAV_ITEMS, useValue: sidebarGroupA, multi: true },
      { provide: SIDEBAR_NAV_ITEMS, useValue: sidebarGroupB, multi: true },
      { provide: SHELL_USER_ROLE, useValue: signal<'seller' | null>('seller') },
    ]);

    expect(facade.filteredSidebarItems().map((item) => item.id)).toEqual(['home', 'seller']);
  });

  it('retorna solo items sin restriccion cuando no hay rol', () => {
    const sidebarGroup: readonly SidebarNavItem[] = [
      { id: 'home', label: 'Inicio', icon: 'house', route: '/home' },
      { id: 'admin', label: 'Admin', icon: 'settings', route: '/admin', roles: ['admin'] },
    ];

    const facade = setup([
      { provide: SIDEBAR_NAV_ITEMS, useValue: sidebarGroup, multi: true },
      { provide: SHELL_USER_ROLE, useValue: signal<null>(null) },
    ]);

    expect(facade.filteredSidebarItems().map((item) => item.id)).toEqual(['home']);
  });

  it('delegates logout al token SHELL_LOGOUT y navega al login', () => {
    const logoutSpy = jest.fn();
    const facade = setup([
      { provide: SHELL_LOGOUT, useValue: logoutSpy },
    ]);

    facade.logout();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith([AppRoutes.login]);
  });

  it('handleProfileMenuAction navega cuando recibe una ruta', () => {
    const facade = setup();

    facade.handleProfileMenuAction('/profile');

    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('handleProfileMenuAction ignora acciones no navegables', () => {
    const facade = setup();

    facade.handleProfileMenuAction('settings');

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('delegates setSearchQuery a GlobalSearchService', () => {
    const facade = setup();

    facade.setSearchQuery('filtro');

    expect(searchServiceMock.setSearchQuery).toHaveBeenCalledWith('filtro');
    expect(searchServiceMock.setSearchQuery).toHaveBeenCalledTimes(1);
  });
});
