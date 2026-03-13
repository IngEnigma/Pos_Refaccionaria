import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  AuthRepository,
  LoginCredentials,
} from '@features/auth/domain/repository/auth-repository';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { LoggerPort } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { LoginUseCase } from './login.usecase';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repositorySpy: jasmine.SpyObj<Pick<AuthRepository, 'login' | 'refresh'>>;
  let sessionServiceSpy: jasmine.SpyObj<Pick<SessionStateService, 'setSession'>>;
  let loggerSpy: jasmine.SpyObj<LoggerPort>;

  const credentials: LoginCredentials = {
    username: 'user',
    password: 'pass',
  };

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<Pick<AuthRepository, 'login' | 'refresh'>>('AuthRepository', [
      'login',
      'refresh',
    ]);
    sessionServiceSpy = jasmine.createSpyObj<Pick<SessionStateService, 'setSession'>>('SessionStateService', [
      'setSession',
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
        LoginUseCase,
        { provide: AuthRepository, useValue: repositorySpy },
        { provide: SessionStateService, useValue: sessionServiceSpy },
        {
          provide: LoggerService,
          useValue: {
            withContext: () => loggerSpy,
          },
        },
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
    );
    repositorySpy.login.and.returnValue(of(session));

    useCase.execute(credentials).subscribe((result) => {
      expect(result).toBe(session);
      expect(sessionServiceSpy.setSession).toHaveBeenCalledWith(session, {
        persist: true,
      });
      done();
    });
  });

  it('rethrows error when login fails', (done) => {
    const error = new Error('invalid credentials');
    repositorySpy.login.and.returnValue(
      throwError(() => error),
    );

    useCase.execute(credentials).subscribe({
      next: () => {
        fail('expected error');
      },
      error: (resultError) => {
        expect(resultError).toBe(error);
        expect(loggerSpy.error).toHaveBeenCalled();
        done();
      },
    });
  });
});
