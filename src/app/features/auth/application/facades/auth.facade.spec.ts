import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthFacade } from './auth.facade';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { STORAGE_PORT, PERSISTENT_STORAGE_PORT } from '@core/ports/storage.port';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { GetMyProfileUseCase } from '@features/auth/application/usecases/get-my-profile.usecase';
import { UpdateMySucursalUseCase } from '@features/auth/application/usecases/update-my-sucursal.usecase';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { LoginCommand } from '@features/auth/application/commands/login.command';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let loggerPort: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    loginUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoginUseCase>;

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
        AuthFacade,
        SessionStateService,
        { provide: LoginUseCase, useValue: loginUseCase },
        // La facade (Fase 1 perfil/sucursal) también inyecta estos use-cases.
        { provide: GetMyProfileUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateMySucursalUseCase, useValue: { execute: jest.fn() } },
        { provide: LOGGER_PORT, useValue: loggerPort },
        { provide: STORAGE_PORT, useValue: { getItem: jest.fn(), setJSON: jest.fn(), removeItem: jest.fn() } },
        { provide: PERSISTENT_STORAGE_PORT, useValue: { getItem: jest.fn(), setJSON: jest.fn(), removeItem: jest.fn(), getJSON: jest.fn() } },
      ],
    });

    facade = TestBed.inject(AuthFacade);
  });

  it('logs in successfully', () => {
    const command: LoginCommand = { username: 'user', password: 'pass', remember: true };
    const session = new Session('access', 'refresh', 0, 0, '1', UserRole.Admin, 'user');
    loginUseCase.execute.mockReturnValue(of(session));

    facade.login(command).subscribe((ok) => {
      expect(ok).toBe(true);
    });

    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  it('handles login failure', () => {
    const command: LoginCommand = { username: 'user', password: 'wrong' };
    loginUseCase.execute.mockReturnValue(throwError(() => new Error('Credenciales inválidas')));

    facade.login(command).subscribe((ok) => {
      expect(ok).toBe(false);
    });

    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBe('Credenciales inválidas');
    expect(loggerPort.warn).toHaveBeenCalled();
  });

  it.todo('logs out user');
});
