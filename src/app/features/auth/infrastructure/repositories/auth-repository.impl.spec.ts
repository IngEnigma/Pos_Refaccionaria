import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthRepositoryImpl, LOGIN_WAKE_RETRIES, LOGIN_WAKE_RETRY_DELAY_MS } from './auth-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { LogLevel } from '@core/logging/log-level.enum';
import { LoginCredentials } from '@features/auth/domain/repository/auth-repository';
import {
  AuthError,
  InvalidCredentialsError,
  NetworkAuthError,
  UnknownAuthError,
} from '@features/auth/domain/errors/auth.errors';
import { LoginResponseDto } from '@features/auth/infrastructure/dtos/auth-login-response.dto';

const envStub: Environment = {
  apiUrl: 'http://api.test',
  production: false,
  loggingLevel: LogLevel.INFO,
};

describe('AuthRepositoryImpl', () => {
  let repository: AuthRepositoryImpl;
  let httpMock: HttpTestingController;
  let loggerPort: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    loggerPort = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        AuthRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
        { provide: LOGGER_PORT, useValue: loggerPort },
      ],
    });

    repository = TestBed.inject(AuthRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts login request and maps session', () => {
    const credentials: LoginCredentials = { username: 'admin', password: 'secret' };
    const response: LoginResponseDto = {
      accessToken: 'access.token.value',
      refreshToken: 'refresh.token.value',
      user: {
        id: 10,
        username: 'admin',
        isAdmin: true,
        isStaff: false,
      },
    };

    repository.login(credentials).subscribe((session) => {
      expect(session.userId).toBe('10');
      expect(session.username).toBe('admin');
      expect(session.accessToken).toBe('access.token.value');
    });

    const req = httpMock.expectOne('http://api.test/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'secret' });
    req.flush(response);
  });

  it('posts refresh request and returns access token', () => {
    // El backend expone POST /api/token/refresh (SimpleJWT, ver usuario/urls.py).
    repository.refresh('refresh-token').subscribe((access) => {
      expect(access).toBe('new-access');
    });

    const req = httpMock.expectOne('http://api.test/token/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: 'refresh-token' });
    req.flush({ access: 'new-access' });
  });

  describe('mapeo de errores HTTP', () => {
    const credentials: LoginCredentials = { username: 'admin', password: 'secret' };

    function loginError(flush: (req: ReturnType<HttpTestingController['expectOne']>) => void): unknown {
      let error: unknown;
      repository.login(credentials).subscribe({ error: (e) => (error = e) });
      flush(httpMock.expectOne('http://api.test/login'));
      return error;
    }

    it('401 → InvalidCredentialsError', () => {
      const error = loginError((req) =>
        req.flush({ detail: 'No active account' }, { status: 401, statusText: 'Unauthorized' }),
      );

      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect((error as Error).message).toBe('Credenciales inválidas');
    });

    it('status 0 (sin red) → NetworkAuthError tras agotar los reintentos', fakeAsync(() => {
      let error: unknown;
      repository.login(credentials).subscribe({ error: (e) => (error = e) });
      for (let i = 0; i <= LOGIN_WAKE_RETRIES; i++) {
        tick(i ? LOGIN_WAKE_RETRY_DELAY_MS : 0);
        httpMock.expectOne('http://api.test/login').error(new ProgressEvent('error'));
      }

      expect(error).toBeInstanceOf(NetworkAuthError);
    }));

    it.each([0, 502, 503, 504])('status %i (servidor despertando) → reintenta y entra cuando responde', fakeAsync((status: number) => {
      let userId: string | undefined;
      repository.login(credentials).subscribe((s) => (userId = s.userId));
      const req = httpMock.expectOne('http://api.test/login');
      if (status) req.flush(null, { status, statusText: 'Waking' });
      else req.error(new ProgressEvent('error'));

      tick(LOGIN_WAKE_RETRY_DELAY_MS);
      httpMock.expectOne('http://api.test/login').flush({
        accessToken: 'a', refreshToken: 'r', user: { id: 7, username: 'admin', isAdmin: true, isStaff: false },
      });

      expect(userId).toBe('7');
    }));

    it('500 con { detail } → UnknownAuthError con ese texto', () => {
      const error = loginError((req) =>
        req.flush({ detail: 'Fallo interno' }, { status: 500, statusText: 'Server Error' }),
      );

      expect(error).toBeInstanceOf(UnknownAuthError);
      expect((error as Error).message).toBe('Fallo interno');
    });

    it('500 con { message } → UnknownAuthError con ese texto', () => {
      const error = loginError((req) =>
        req.flush({ message: 'Mantenimiento' }, { status: 500, statusText: 'Server Error' }),
      );

      expect(error).toBeInstanceOf(UnknownAuthError);
      expect((error as Error).message).toBe('Mantenimiento');
    });

    it.each([
      ['cuerpo HTML', '<html>502</html>'],
      ['objeto sin detail ni message', { errors: ['x'] }],
      ['detail que no es texto', { detail: 42 }],
    ])('500 con %s → UnknownAuthError genérico', (_caso, body) => {
      const error = loginError((req) => req.flush(body, { status: 500, statusText: 'Server Error' }));

      expect(error).toBeInstanceOf(UnknownAuthError);
      expect((error as Error).message).toBe('Error desconocido');
    });

    it('el error de refresh también se traduce (401 → InvalidCredentialsError)', () => {
      let error: unknown;
      repository.refresh('r').subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne('http://api.test/token/refresh')
        .flush({ detail: 'Token is invalid' }, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeInstanceOf(InvalidCredentialsError);
    });

    it('registra el fallo sin incluir la contraseña', () => {
      loginError((req) => req.flush({}, { status: 500, statusText: 'Server Error' }));

      expect(loggerPort.error).toHaveBeenCalled();
      expect(JSON.stringify(loggerPort.error.mock.calls)).not.toContain('secret');
    });
  });

  describe('errores que no vienen del HttpClient', () => {
    it('un Error común se relanza tal cual', () => {
      const boom = new Error('boom');
      const http = TestBed.inject(HttpClient);
      jest.spyOn(http, 'post').mockReturnValue(throwError(() => boom));
      let error: unknown;

      repository.login({ username: 'a', password: 'b' }).subscribe({ error: (e) => (error = e) });

      expect(error).toBe(boom);
    });

    it('un valor que no es Error → UnknownAuthError', () => {
      const http = TestBed.inject(HttpClient);
      jest.spyOn(http, 'post').mockReturnValue(throwError(() => 'raro'));
      let error: unknown;

      repository.refresh('r').subscribe({ error: (e) => (error = e) });

      expect(error).toBeInstanceOf(UnknownAuthError);
      expect(error).toBeInstanceOf(AuthError);
    });
  });
});
