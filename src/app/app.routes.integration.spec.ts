/**
 * INTEGRACIÓN (INT-04): Router real + authGuard + roleGuard con la tabla REAL de `app.routes.ts`
 * (se conservan `canActivate`, `data` y redirecciones; solo se sustituyen layout y `loadChildren` por un stub).
 */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter } from '@angular/router';

import { LOGGER_PORT } from '@core/logging/logger.port';
import { PERSISTENT_STORAGE_PORT, STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { routes } from './app.routes';

@Component({ standalone: true, template: '' })
class StubPage {}

const stubbed: Route[] = routes.map(({ component, loadChildren, ...route }) =>
  route.redirectTo === undefined ? { ...route, component: StubPage } : route,
);

describe('Rutas protegidas integración (router + authGuard + roleGuard)', () => {
  let router: Router;
  let sessionState: SessionStateService;

  const loginAs = (role: UserRole) =>
    sessionState.setSession(new Session('tok', 'ref', 0, 0, '1', role, 'u'));

  const visit = async (url: string) => {
    await router.navigateByUrl(url);
    return decodeURIComponent(router.url);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(stubbed),
        {
          provide: LOGGER_PORT,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            fatal: jest.fn(),
            withContext: jest.fn().mockReturnThis(),
          },
        },
        { provide: STORAGE_PORT, useClass: InMemoryStorageService },
        { provide: PERSISTENT_STORAGE_PORT, useClass: InMemoryStorageService },
      ],
    });
    router = TestBed.inject(Router);
    sessionState = TestBed.inject(SessionStateService);
  });

  describe('sin sesión', () => {
    it.each(['/sales', '/admin', '/branches', '/branch-pricing', '/inventory-by-branch', '/manager'])(
      '%s redirige a /login con redirectTo',
      async (url) => {
        expect(await visit(url)).toBe(`/login?redirectTo=${url}`);
      },
    );

    it('conserva la query en redirectTo', async () => {
      await router.navigateByUrl('/clients?q=ana');
      expect(router.parseUrl(router.url).queryParams['redirectTo']).toBe('/clients?q=ana');
    });

    it('/login es público y la raíz o una ruta desconocida van a /login', async () => {
      expect(await visit('/login')).toBe('/login');
      expect(await visit('/')).toBe('/login');
      expect(await visit('/no-existe')).toBe('/login');
    });
  });

  describe('seller', () => {
    beforeEach(() => loginAs(UserRole.Seller));

    it.each(['/sales', '/inventory', '/history', '/clients'])('entra a %s', async (url) => {
      expect(await visit(url)).toBe(url);
    });

    it.each(['/admin', '/branches', '/branch-pricing', '/manager', '/inventory-by-branch'])(
      'no entra a %s: redirige a /sales',
      async (url) => {
        expect(await visit(url)).toBe('/sales');
      },
    );
  });

  describe('manager', () => {
    beforeEach(() => loginAs(UserRole.Manager));

    it.each(['/inventory-by-branch', '/manager', '/sales'])('entra a %s', async (url) => {
      expect(await visit(url)).toBe(url);
    });

    it.each(['/branches', '/admin', '/branch-pricing'])('no entra a %s: redirige a /sales', async (url) => {
      expect(await visit(url)).toBe('/sales');
    });
  });

  describe('admin', () => {
    beforeEach(() => loginAs(UserRole.Admin));

    it.each(['/admin', '/branches', '/branch-pricing', '/inventory-by-branch', '/manager', '/sales'])(
      'entra a %s',
      async (url) => {
        expect(await visit(url)).toBe(url);
      },
    );
  });

  it('al cerrar sesión estando en una ruta de admin, la siguiente navegación vuelve a /login', async () => {
    loginAs(UserRole.Admin);
    expect(await visit('/admin')).toBe('/admin');

    sessionState.clearSession();

    expect(await visit('/branches')).toBe('/login?redirectTo=/branches');
  });
});
