/**
 * INTEGRACIÓN (INT-01, INT-02, INT-03): AuthFacade + use cases + AuthRepositoryImpl + ProfileRepositoryImpl
 * + cadena real de interceptores (httpError → authToken → trailingSlash) + SessionStateService
 * (storage en memoria y "persistente" en memoria) + authGuard + HttpClient mockeado.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { PERSISTENT_STORAGE_PORT, STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { environment } from '@env/environment';
import { AuthFacade } from './auth.facade';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { ProfileRepositoryImpl } from '@features/auth/infrastructure/repositories/profile-repository.impl';
import { authTokenInterceptor } from '@features/auth/infrastructure/http/auth-token.interceptor';
import { authGuard } from '@features/auth/presentation/guards/auth.guard';

const API = environment.apiUrl;

/** JWT sin firma con `exp` en segundos (futuro por defecto). */
function jwt(tag: string, expInSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expInSeconds;
  const payload = btoa(JSON.stringify({ exp, tag })).replace(/=/g, '');
  return `h.${payload}.s`;
}

const loginDto = (access: string, refresh: string) => ({
  accessToken: access,
  refreshToken: refresh,
  user: { id: 7, username: 'gerente1', isAdmin: false, isStaff: true },
});

describe('Sesión integración (login, perfil, refresh concurrente, logout)', () => {
  let facade: AuthFacade;
  let sessionState: SessionStateService;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([httpErrorInterceptor, authTokenInterceptor, trailingSlashInterceptor]),
        ),
        provideHttpClientTesting(),
        AuthRepositoryImpl,
        { provide: AuthRepository, useExisting: AuthRepositoryImpl },
        { provide: ProfileRepository, useClass: ProfileRepositoryImpl },
        { provide: APP_ENV, useValue: environment },
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

    facade = TestBed.inject(AuthFacade);
    sessionState = TestBed.inject(SessionStateService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  /** Login completo por HTTP; deja la sesión activa con los tokens indicados. */
  async function loginAs(access: string, refresh: string, remember = false): Promise<void> {
    const done = firstValueFrom(facade.login({ username: 'gerente1', password: 'x', remember }));
    httpMock.expectOne(`${API}/login`).flush(loginDto(access, refresh));
    expect(await done).toBe(true);
  }

  describe('INT-01 login → perfil → cambio de sucursal', () => {
    it('login, carga el perfil con el token y cambia de sucursal', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400));
      expect(facade.isAuthenticated()).toBe(true);
      expect(facade.role()).toBe(UserRole.Manager);
      expect(facade.sucursalId()).toBeNull();

      const profile = firstValueFrom(facade.refreshProfile());
      const get = httpMock.expectOne(`${API}/perfil/`);
      expect(get.request.method).toBe('GET');
      expect(get.request.headers.get('Authorization')).toBe(`Bearer ${sessionState.getSession()!.accessToken}`);
      get.flush({ id: 1, id_usuario: 7, id_sucursal: 3 });
      await profile;
      expect(facade.sucursalId()).toBe(3);

      const change = firstValueFrom(facade.updateMySucursal(5));
      const put = httpMock.expectOne(`${API}/perfil/`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toEqual({ id_sucursal: 5 });
      put.flush({ id: 1, id_usuario: 7, id_sucursal: 5 });
      await change;
      expect(facade.sucursalId()).toBe(5);
    });

    it('quitar la sucursal (null) manda id_sucursal null y limpia la sucursal activa', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400));
      sessionState.setSucursalId(3);

      const change = firstValueFrom(facade.updateMySucursal(null));
      const put = httpMock.expectOne(`${API}/perfil/`);
      expect(put.request.body).toEqual({ id_sucursal: null });
      put.flush({ id: 1, id_usuario: 7, id_sucursal: null });
      await change;

      expect(facade.sucursalId()).toBeNull();
    });

    it('si el perfil falla (404), refreshProfile no rompe y conserva la sucursal', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400));
      sessionState.setSucursalId(3);

      const profile = firstValueFrom(facade.refreshProfile());
      httpMock.expectOne(`${API}/perfil/`).flush({ detail: 'no' }, { status: 404, statusText: 'Not Found' });

      await expect(profile).resolves.toBeUndefined();
      expect(facade.sucursalId()).toBe(3);
    });

    it('si el cambio de sucursal falla (400), el error llega al llamador y la sucursal no cambia', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400));
      sessionState.setSucursalId(3);

      const change = firstValueFrom(facade.updateMySucursal(99)).catch((e) => e);
      httpMock
        .expectOne(`${API}/perfil/`)
        .flush({ id_sucursal: ['Sucursal inexistente'] }, { status: 400, statusText: 'Bad Request' });

      expect((await change).status).toBe(400);
      expect(facade.sucursalId()).toBe(3);
    });

    it('login con "recordar" persiste la sesión; sin "recordar" no', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400), true);
      const persistent = TestBed.inject(PERSISTENT_STORAGE_PORT);
      expect(persistent.getItem('session:remember')).toBe('true');
      expect(persistent.getJSON<{ username: string }>('session')?.username).toBe('gerente1');

      facade.logout();
      await loginAs(jwt('a2'), jwt('r2', 86400), false);
      expect(persistent.getItem('session:remember')).toBeNull();
      expect(persistent.getItem('session')).toBeNull();
    });
  });

  describe('INT-02 refresh concurrente', () => {
    const startWithExpiredServerToken = async () => {
      await loginAs(jwt('viejo'), jwt('r1', 86400), true);
    };

    it('dos 401 simultáneos disparan un solo refresh y ambas peticiones se reintentan con el token nuevo', async () => {
      await startWithExpiredServerToken();
      const nuevo = jwt('nuevo');

      const a = firstValueFrom(http.get(`${API}/productos/`));
      const b = firstValueFrom(http.get(`${API}/clientes/`));

      const reqA = httpMock.expectOne(`${API}/productos/`);
      const reqB = httpMock.expectOne(`${API}/clientes/`);
      reqA.flush('x', { status: 401, statusText: 'Unauthorized' });
      reqB.flush('x', { status: 401, statusText: 'Unauthorized' });

      const refresh = httpMock.expectOne(`${API}/token/refresh`);
      expect(refresh.request.method).toBe('POST');
      expect(refresh.request.headers.has('Authorization')).toBe(false);
      refresh.flush({ access: nuevo });

      const retryA = httpMock.expectOne(`${API}/productos/`);
      const retryB = httpMock.expectOne(`${API}/clientes/`);
      expect(retryA.request.headers.get('Authorization')).toBe(`Bearer ${nuevo}`);
      expect(retryB.request.headers.get('Authorization')).toBe(`Bearer ${nuevo}`);
      retryA.flush([{ id: 1 }]);
      retryB.flush([{ id: 2 }]);

      await expect(a).resolves.toEqual([{ id: 1 }]);
      await expect(b).resolves.toEqual([{ id: 2 }]);
      expect(sessionState.getSession()?.accessToken).toBe(nuevo);
      expect(TestBed.inject(PERSISTENT_STORAGE_PORT).getJSON<{ accessToken: string }>('session')?.accessToken).toBe(nuevo);
    });

    it('tras un refresh exitoso, un 401 posterior vuelve a refrescar (el flujo no queda atascado)', async () => {
      await startWithExpiredServerToken();
      const t2 = jwt('t2');
      const t3 = jwt('t3');

      for (const nuevo of [t2, t3]) {
        const call = firstValueFrom(http.get(`${API}/productos/`));
        httpMock.expectOne(`${API}/productos/`).flush('x', { status: 401, statusText: 'Unauthorized' });
        httpMock.expectOne(`${API}/token/refresh`).flush({ access: nuevo });
        httpMock.expectOne(`${API}/productos/`).flush([]);
        await call;
        expect(sessionState.getSession()?.accessToken).toBe(nuevo);
      }
    });

    it('si el refresh falla (401): sesión limpia en memoria y storage, ambas peticiones fallan y se redirige a login', async () => {
      await startWithExpiredServerToken();

      const a = firstValueFrom(http.get(`${API}/productos/`)).catch((e) => e);
      const b = firstValueFrom(http.get(`${API}/clientes/`)).catch((e) => e);
      httpMock.expectOne(`${API}/productos/`).flush('x', { status: 401, statusText: 'Unauthorized' });
      httpMock.expectOne(`${API}/clientes/`).flush('x', { status: 401, statusText: 'Unauthorized' });

      httpMock
        .expectOne(`${API}/token/refresh`)
        .flush({ detail: 'Token is invalid or expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(await a).toBeDefined();
      expect(await b).toBeDefined();
      expect(sessionState.getSession()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
      expect(TestBed.inject(STORAGE_PORT).getItem('session')).toBeNull();
      expect(TestBed.inject(PERSISTENT_STORAGE_PORT).getItem('session')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('sin refresh token, el 401 limpia la sesión sin llamar a /token/refresh', async () => {
      sessionState.setSession(new Session(jwt('a1'), null, 0, 0, '7', UserRole.Manager, 'gerente1'));

      const call = firstValueFrom(http.get(`${API}/productos/`)).catch((e) => e);
      httpMock.expectOne(`${API}/productos/`).flush('x', { status: 401, statusText: 'Unauthorized' });

      await call;
      httpMock.expectNone(`${API}/token/refresh`);
      expect(sessionState.getSession()).toBeNull();
    });
  });

  describe('INT-03 logout', () => {
    const guardResult = () => {
      const state = { url: '/sales' } as RouterStateSnapshot;
      return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));
    };

    it('limpia memoria, storage de sesión y storage persistente, y el guard bloquea después', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400), true);
      const persistent = TestBed.inject(PERSISTENT_STORAGE_PORT);
      expect(guardResult()).toBe(true);
      expect(persistent.getItem('session')).not.toBeNull();

      facade.logout();

      expect(facade.isAuthenticated()).toBe(false);
      expect(facade.username()).toBe('');
      expect(facade.role()).toBeNull();
      expect(facade.sucursalId()).toBeNull();
      expect(TestBed.inject(STORAGE_PORT).getItem('session')).toBeNull();
      expect(persistent.getItem('session')).toBeNull();
      expect(persistent.getItem('session:remember')).toBeNull();

      const result = guardResult() as UrlTree;
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result)).toBe('/login?redirectTo=%2Fsales');
    });

    it('tras el logout las peticiones salen sin Authorization', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400));
      facade.logout();

      http.get(`${API}/productos/`).subscribe();
      const req = httpMock.expectOne(`${API}/productos/`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });

    it('una sesión nueva en el mismo servicio no hereda datos del usuario anterior', async () => {
      await loginAs(jwt('a1'), jwt('r1', 86400), true);
      sessionState.setSucursalId(9);
      facade.logout();

      await loginAs(jwt('a2'), jwt('r2', 86400), false);

      expect(facade.sucursalId()).toBeNull();
      expect(TestBed.inject(PERSISTENT_STORAGE_PORT).getItem('session')).toBeNull();
    });
  });
});
