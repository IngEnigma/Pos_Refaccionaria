import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { AppRoutes } from '@app/app-routes';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let role: WritableSignal<string | null>;
  let routerSpy: { createUrlTree: jest.Mock };
  const urlTree = {} as UrlTree;

  const run = (roles?: string[], url = '/admin') =>
    TestBed.runInInjectionContext(() =>
      roleGuard({ data: roles ? { roles } : {} } as never, { url } as never),
    );

  beforeEach(() => {
    role = signal<string | null>(null);
    routerSpy = { createUrlTree: jest.fn().mockReturnValue(urlTree) };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SessionStateService, useValue: { role } },
        {
          provide: LOGGER_PORT,
          useValue: { withContext: jest.fn().mockReturnThis(), warn: jest.fn(), debug: jest.fn() },
        },
      ],
    });
  });

  it('permite el acceso cuando la ruta no declara data.roles', () => {
    role.set('seller');

    expect(run()).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('permite el acceso cuando el rol está en data.roles', () => {
    role.set('admin');

    expect(run(['admin'])).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirige a /sales cuando el rol no está en data.roles', () => {
    role.set('seller');

    const result = run(['admin']);

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith([AppRoutes.sales]);
    expect(result).toBe(urlTree);
  });

  it('redirige a login con redirectTo cuando no hay sesión', () => {
    const result = run(['admin'], '/branches');

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith([AppRoutes.login], {
      queryParams: { redirectTo: '/branches' },
    });
    expect(result).toBe(urlTree);
  });
});
