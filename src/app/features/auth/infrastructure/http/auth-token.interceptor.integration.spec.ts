/**
 * INTEGRACIÓN: authTokenInterceptor + AuthTokenRefreshOrchestrator + RefreshTokenUseCase
 * + AuthRepositoryImpl + SessionStateService (storage en memoria) + HttpClient (mockeado).
 * Cubre qué peticiones llevan el token y qué pasa con un 401 según la petición.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LogLevel } from '@core/logging/log-level.enum';
import { PERSISTENT_STORAGE_PORT, STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { InvalidCredentialsError } from '@features/auth/domain/errors/auth.errors';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor integración', () => {
  const API = 'http://api.test/api';
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let sessionState: SessionStateService;
  let repository: AuthRepository;

  const sessionWith = (refreshToken: string | null = 'refresh') =>
    new Session('access-1', refreshToken, 0, 0, 'u-1', UserRole.Seller, 'cajero');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        AuthRepositoryImpl,
        { provide: AuthRepository, useExisting: AuthRepositoryImpl },
        { provide: APP_ENV, useValue: { apiUrl: API, production: false, loggingLevel: LogLevel.INFO } },
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

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    sessionState = TestBed.inject(SessionStateService);
    repository = TestBed.inject(AuthRepository);
  });

  afterEach(() => httpMock.verify());

  describe('qué peticiones llevan el token', () => {
    beforeEach(() => sessionState.setSession(sessionWith()));

    it('la API propia lleva Authorization: Bearer', () => {
      http.get(`${API}/productos/`).subscribe();

      const req = httpMock.expectOne(`${API}/productos/`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
      req.flush([]);
    });

    it('un host externo no recibe el token', () => {
      http.get('https://externo.example.com/datos').subscribe();

      const req = httpMock.expectOne('https://externo.example.com/datos');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('la petición de refresh no lleva el access token', () => {
      repository.refresh('refresh').subscribe();

      const req = httpMock.expectOne(`${API}/token/refresh`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ access: 'access-2' });
    });
  });

  describe('401 en peticiones que no son de la API con sesión', () => {
    it('401 de un host externo no dispara refresh ni reenvía el token', async () => {
      sessionState.setSession(sessionWith());
      const result = firstValueFrom(http.get('https://externo.example.com/datos')).catch((e) => e);

      httpMock
        .expectOne('https://externo.example.com/datos')
        .flush('no', { status: 401, statusText: 'Unauthorized' });

      expect((await result).status).toBe(401);
      httpMock.expectNone(`${API}/token/refresh`);
      expect(sessionState.getSession()).not.toBeNull();
    });
  });

  describe('login con credenciales incorrectas (sin sesión previa)', () => {
    it('el 401 llega como InvalidCredentialsError, no como error de refresh', async () => {
      const result = firstValueFrom(repository.login({ username: 'x', password: 'mala' })).catch((e) => e);

      httpMock
        .expectOne(`${API}/login`)
        .flush({ detail: 'No active account' }, { status: 401, statusText: 'Unauthorized' });

      const error = await result;
      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect(error.message).toBe('Credenciales inválidas');
    });
  });
});
