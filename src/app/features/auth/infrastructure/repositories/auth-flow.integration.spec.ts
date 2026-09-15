/**
 * EJEMPLO INTEGRACIÓN: Facade -> UseCase -> Repository.impl -> HttpClient (mockeado)
 * + SessionState con storage en memoria + ng-mocks para el Logger.
 * Ejecuta: npm run test:integration
 *
 * Cubre SIS-001/SIS-002 a nivel integración (sin navegador).
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LogLevel } from '@core/logging/log-level.enum';
import {
  PERSISTENT_STORAGE_PORT,
  STORAGE_PORT,
} from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from './auth-repository.impl';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { LoginResponseDto } from '@features/auth/infrastructure/dtos/auth-login-response.dto';

describe('Auth flow integración (usecase + repository + http + session)', () => {
  let useCase: LoginUseCase;
  let sessionState: SessionStateService;
  let httpMock: HttpTestingController;

  const API = 'http://api.test';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoginUseCase,
        SessionStateService,
        AuthRepositoryImpl,
        { provide: AuthRepository, useExisting: AuthRepositoryImpl },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: { apiUrl: API, production: false, loggingLevel: LogLevel.INFO } },
        // ng-mocks: mockea el puerto de logging con withContext encadenable
        MockProvider(LOGGER_PORT, {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          fatal: jest.fn(),
          withContext: jest.fn().mockReturnThis(),
        } as never),
        { provide: STORAGE_PORT, useClass: InMemoryStorageService },
        { provide: PERSISTENT_STORAGE_PORT, useClass: InMemoryStorageService },
      ],
    });

    useCase = TestBed.inject(LoginUseCase);
    sessionState = TestBed.inject(SessionStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login válido guarda sesión y la expone como autenticada', async () => {
    const dto: LoginResponseDto = {
      accessToken: 'access.token.value',
      refreshToken: 'refresh.token.value',
      user: { id: 10, username: 'vendedor1', isAdmin: false, isStaff: true },
    };

    const promise = firstValueFrom(
      useCase.execute({ username: 'vendedor1', password: 'secreta', remember: false }),
    );

    const req = httpMock.expectOne(`${API}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'vendedor1', password: 'secreta' });
    req.flush(dto);

    const session = await promise;

    expect(session.username).toBe('vendedor1');
    expect(sessionState.isAuthenticated()).toBe(true);
    expect(sessionState.username()).toBe('vendedor1');
    expect(sessionState.getSession()?.accessToken).toBe('access.token.value');
  });

  it('credenciales inválidas (401) propagan InvalidCredentialsError y no autentican', async () => {
    const promise = firstValueFrom(
      useCase.execute({ username: 'nadie', password: 'mal', remember: false }),
    );

    const req = httpMock.expectOne(`${API}/login`);
    req.flush({ detail: 'No active account found' }, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toThrow();
    expect(sessionState.isAuthenticated()).toBe(false);
    expect(sessionState.getSession()).toBeNull();
  });
});
