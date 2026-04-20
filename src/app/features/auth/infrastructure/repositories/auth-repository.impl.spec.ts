import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthRepositoryImpl } from './auth-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { LogLevel } from '@core/logging/log-level.enum';
import { LoginCredentials } from '@features/auth/domain/repository/auth-repository';
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
    repository.refresh('refresh-token').subscribe((access) => {
      expect(access).toBe('new-access');
    });

    const req = httpMock.expectOne('http://api.test/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: 'refresh-token' });
    req.flush({ access: 'new-access' });
  });
});
