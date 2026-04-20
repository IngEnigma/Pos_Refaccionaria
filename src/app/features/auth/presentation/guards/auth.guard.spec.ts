import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { AppRoutes } from '@app/app-routes';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let routerSpy: jest.Mocked<Partial<Router>>;
  let sessionServiceSpy: jest.Mocked<Partial<SessionStateService>>;
  let loggerSpy: jest.Mocked<Partial<LoggerPort>>;
  let isAuthenticatedMock: WritableSignal<boolean>;

  beforeEach(() => {
    isAuthenticatedMock = signal(false);
    routerSpy = {
      createUrlTree: jest.fn(),
    };

    sessionServiceSpy = {
      isAuthenticated: isAuthenticatedMock,
    } as any;

    loggerSpy = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SessionStateService, useValue: sessionServiceSpy },
        { provide: LOGGER_PORT, useValue: loggerSpy },
      ],
    });
  });

  it('allows access when session is authenticated', () => {
    isAuthenticatedMock.set(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/sales' } as never),
    );

    expect(result).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login when session is not authenticated', () => {
    const urlTree = {} as UrlTree;
    isAuthenticatedMock.set(false);
    (routerSpy.createUrlTree as jest.Mock).mockReturnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/sales' } as never),
    );

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith([AppRoutes.login], {
      queryParams: { redirectTo: '/sales' },
    });
    expect(result).toBe(urlTree);
  });
});
