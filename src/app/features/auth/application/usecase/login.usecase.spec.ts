import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { LoginCommand } from '@features/auth/application/commands/login.command';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { LoginUseCase } from './login.usecase';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repositorySpy: jest.Mocked<Pick<AuthRepository, 'login' | 'refresh'>>;
  let sessionServiceSpy: jest.Mocked<Pick<SessionStateService, 'setSession'>>;
  let loggerSpy: jest.Mocked<LoggerPort>;

  const command: LoginCommand = {
    username: 'user',
    password: 'pass',
    remember: true,
  };

  beforeEach(() => {
    repositorySpy = {
      login: jest.fn(),
      refresh: jest.fn(),
    } as unknown as jest.Mocked<Pick<AuthRepository, 'login' | 'refresh'>>;

    sessionServiceSpy = {
      setSession: jest.fn(),
    } as unknown as jest.Mocked<Pick<SessionStateService, 'setSession'>>;

    loggerSpy = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        LoginUseCase,
        { provide: AuthRepository, useValue: repositorySpy },
        { provide: SessionStateService, useValue: sessionServiceSpy },
        { provide: LOGGER_PORT, useValue: loggerSpy },
      ],
    });

    useCase = TestBed.inject(LoginUseCase);
  });

  it('stores session when login succeeds', (done) => {
    const now = Math.floor(Date.now() / 1000);
    const session = new Session(
      'access',
      'refresh',
      now + 3600,
      now + 7200,
      'u-1',
      UserRole.Admin,
      'testuser'
    );
    repositorySpy.login.mockReturnValue(of(session));

    useCase.execute(command).subscribe((result) => {
      expect(result).toBe(session);
      expect(sessionServiceSpy.setSession).toHaveBeenCalledWith(session, {
        persist: true,
        remember: true,
      });
      done();
    });
  });

  it('rethrows error when login fails', (done) => {
    const error = new Error('invalid credentials');
    repositorySpy.login.mockReturnValue(
      throwError(() => error),
    );

    useCase.execute(command).subscribe({
      next: () => {
        throw new Error('expected error');
      },
      error: (resultError) => {
        expect(resultError).toBe(error);
        expect(loggerSpy.error).toHaveBeenCalled();
        done();
      },
    });
  });
});
