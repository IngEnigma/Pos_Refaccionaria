import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { LoggerPort } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { AppRoutes } from '@app/app-routes';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let sessionServiceSpy: jasmine.SpyObj<SessionStateService>;
  let loggerSpy: jasmine.SpyObj<LoggerPort>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    sessionServiceSpy = jasmine.createSpyObj<SessionStateService>('SessionStateService', [
      'isAuthenticated',
    ]);
    loggerSpy = jasmine.createSpyObj<LoggerPort>('LoggerPort', [
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SessionStateService, useValue: sessionServiceSpy },
        {
          provide: LoggerService,
          useValue: {
            withContext: () => loggerSpy,
          },
        },
      ],
    });
  });

  it('allows access when session is authenticated', () => {
    sessionServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/sales' } as never),
    );

    expect(result).toBeTrue();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login when session is not authenticated', () => {
    const urlTree = {} as UrlTree;
    sessionServiceSpy.isAuthenticated.and.returnValue(false);
    routerSpy.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/sales' } as never),
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith([AppRoutes.login], {
      queryParams: { redirectTo: '/sales' },
    });
    expect(result).toBe(urlTree);
  });
});
