import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { STORAGE_PORT, PERSISTENT_STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { UrlSanitizerService } from '@core/utils/url-sanitizer.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { authTokenInterceptor } from '@features/auth/infrastructure/http/auth-token.interceptor';
import { AuthTokenRefreshOrchestrator } from '@features/auth/application/services/auth-token-refresh-orchestrator.service';
import { RefreshTokenUseCase } from '@features/auth/application/usecase/refresh.usecase';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { RetryStrategyService } from '@core/http/retry/retry.strategy';
import { HttpErrorHandlerService } from '@core/http/error/http-error.handler';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from './sale-repository.impl';
import { SaleCreationError } from '@features/sales/domain/errors/sales.errors';

// Integración real: SaleRepositoryImpl -> cadena de interceptores de producción
// (httpError + authToken + trailingSlash) -> orquestador/sesión/refresh/repositorios reales.
// Sin dobles de colaboradores: el único borde simulado es el transporte HTTP.
describe('SaleRepositoryImpl con autenticación (integración)', () => {
  const API = environment.apiUrl;
  const VENTAS = `${API}/ventas/`;
  const REFRESH = `${API}/token/refresh`;
  let httpMock: HttpTestingController;
  let repository: SaleRepository;
  let sessions: SessionStateService;

  const futureExp = () => Math.floor(Date.now() / 1000) + 3600;

  const realSession = (overrides: Partial<{ access: string; refresh: string | null }> = {}) =>
    new Session(
      overrides.access ?? 'access-inicial',
      overrides.refresh !== undefined ? overrides.refresh : 'refresh-valido',
      futureExp(),
      futureExp(),
      '1',
      UserRole.Seller,
      'vendedora',
    );

  const craftedJwt = (exp: number) => {
    const b64url = (s: string) =>
      btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `h.${b64url(JSON.stringify({ exp }))}.s`;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor, authTokenInterceptor, trailingSlashInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: STORAGE_PORT, useClass: InMemoryStorageService },
        { provide: PERSISTENT_STORAGE_PORT, useClass: LocalStorageService },
        UrlSanitizerService,
        RetryStrategyService,
        HttpErrorHandlerService,
        SessionStateService,
        AuthTokenRefreshOrchestrator,
        RefreshTokenUseCase,
        { provide: AuthRepository, useClass: AuthRepositoryImpl },
        { provide: SaleRepository, useClass: SaleRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    repository = TestBed.inject(SaleRepository);
    sessions = TestBed.inject(SessionStateService);
  });

  afterEach(() => httpMock.verify());

  // Verifica que con sesión activa la petición de Ventas salga con el Bearer de la sesión real.
  it('con sesión activa la petición de Ventas lleva el Bearer de la sesión', (done) => {
    sessions.setSession(realSession({ access: 'token-sesion-123' }));

    repository.createSale({ idMetodoPago: 1 }).subscribe({
      next: (sale) => {
        expect(sale.id).toBe(50);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(VENTAS);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-sesion-123');
    req.flush({ id: 50, id_usuario: 1, id_inventario: 1, id_metodoPago: 1, total: '100.00', fecha: '2024-01-01' });
  });

  // Verifica que un 401 sin refresh token limpie la sesión y llegue al repositorio como SaleCreationError.
  it('401 sin refresh token limpia la sesión y propaga SaleCreationError', (done) => {
    sessions.setSession(realSession({ access: 'token-vencido', refresh: null }));

    repository.createSale({ idMetodoPago: 1 }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleCreationError);
        expect(err.message).toBe('No refresh token available');
        expect(sessions.getSession()).toBeNull();
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush({ detail: 'Token inválido.' }, { status: 401, statusText: 'Unauthorized' });
  });

  // Verifica el refresh real: 401 -> POST token/refresh -> reintento con el nuevo Bearer -> venta exitosa.
  it('401 con refresh válido refresca el token y reintenta la venta con el nuevo Bearer', (done) => {
    sessions.setSession(realSession({ access: 'token-viejo', refresh: 'refresh-valido' }));
    const nuevoJwt = craftedJwt(futureExp());

    repository.createSale({ idMetodoPago: 2 }).subscribe({
      next: (sale) => {
        expect(sale.id).toBe(51);
        expect(sessions.getSession()?.accessToken).toBe(nuevoJwt);
        done();
      },
      error: done.fail,
    });

    const first = httpMock.expectOne(VENTAS);
    expect(first.request.headers.get('Authorization')).toBe('Bearer token-viejo');
    first.flush({ detail: 'Token expirado.' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(REFRESH);
    expect(refresh.request.method).toBe('POST');
    expect(refresh.request.body).toEqual({ refresh: 'refresh-valido' });
    refresh.flush({ access: nuevoJwt });

    const retry = httpMock.expectOne(VENTAS);
    expect(retry.request.headers.get('Authorization')).toBe(`Bearer ${nuevoJwt}`);
    retry.flush({ id: 51, id_usuario: 1, id_inventario: 1, id_metodoPago: 2, total: '200.00', fecha: '2024-01-01' });
  });
});
