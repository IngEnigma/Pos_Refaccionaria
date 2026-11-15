import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

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
import {
  AuthError,
  InvalidCredentialsError,
  NetworkAuthError,
  UnknownAuthError,
} from '@features/auth/domain/errors/auth.errors';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let getMyProfile: { execute: jest.Mock };
  let updateMySucursal: { execute: jest.Mock };
  let storage: { getItem: jest.Mock; setJSON: jest.Mock; removeItem: jest.Mock };
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

    getMyProfile = { execute: jest.fn() };
    updateMySucursal = { execute: jest.fn() };
    storage = { getItem: jest.fn(), setJSON: jest.fn(), removeItem: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        SessionStateService,
        { provide: LoginUseCase, useValue: loginUseCase },
        // La facade (Fase 1 perfil/sucursal) también inyecta estos use-cases.
        { provide: GetMyProfileUseCase, useValue: getMyProfile },
        { provide: UpdateMySucursalUseCase, useValue: updateMySucursal },
        { provide: LOGGER_PORT, useValue: loggerPort },
        { provide: STORAGE_PORT, useValue: storage },
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

  describe('login: estado y mensajes de error', () => {
    const command: LoginCommand = { username: 'user', password: 'pass' };

    it('loading=true mientras la petición está en curso y false al terminar', () => {
      const request$ = new Subject<Session>();
      loginUseCase.execute.mockReturnValue(request$);

      facade.login(command).subscribe();
      expect(facade.loading()).toBe(true);

      request$.next(new Session('a', 'r', 0, 0, '1', UserRole.Seller, 'user'));
      request$.complete();
      expect(facade.loading()).toBe(false);
    });

    it('limpia el error anterior al iniciar un nuevo login', () => {
      loginUseCase.execute.mockReturnValueOnce(throwError(() => new InvalidCredentialsError()));
      facade.login(command).subscribe();
      expect(facade.errorMessage()).toBe('Credenciales inválidas');

      loginUseCase.execute.mockReturnValueOnce(new Subject<Session>());
      facade.login(command).subscribe();

      expect(facade.errorMessage()).toBeNull();
    });

    it.each([
      ['credenciales inválidas (401)', new InvalidCredentialsError(), 'Credenciales inválidas'],
      ['sin red (status 0)', new NetworkAuthError(), 'Error de red. Verifica tu conexión.'],
      ['error del servidor con detalle (500)', new UnknownAuthError('Servidor caído'), 'Servidor caído'],
      ['AuthError genérico', new AuthError('Cuenta bloqueada'), 'Cuenta bloqueada'],
      ['Error común', new Error('boom'), 'boom'],
      ['Error sin mensaje', new Error(''), 'Error de autenticación'],
      ['valor desconocido', 'raro', 'Error de autenticación'],
    ])('%s → mensaje "%s"', (_caso, error, message) => {
      loginUseCase.execute.mockReturnValue(throwError(() => error));
      let result: boolean | undefined;

      facade.login(command).subscribe((ok) => (result = ok));

      expect(result).toBe(false);
      expect(facade.errorMessage()).toBe(message);
      expect(facade.loading()).toBe(false);
    });
  });

  describe('perfil y sucursal', () => {
    it('refreshProfile guarda la sucursal del perfil en el estado de sesión', () => {
      getMyProfile.execute.mockReturnValue(of({ id: 1, idUsuario: 7, idSucursal: 3 }));

      facade.refreshProfile().subscribe();

      expect(facade.sucursalId()).toBe(3);
    });

    it('refreshProfile no falla si el backend falla: avisa y deja la sucursal como estaba', () => {
      getMyProfile.execute.mockReturnValue(throwError(() => new Error('500')));
      let completed = false;

      facade.refreshProfile().subscribe({ complete: () => (completed = true) });

      expect(completed).toBe(true);
      expect(facade.sucursalId()).toBeNull();
      expect(loggerPort.warn).toHaveBeenCalledWith('Failed to refresh profile', expect.any(Error));
    });

    it('updateMySucursal envía la sucursal y actualiza el estado con la respuesta', () => {
      updateMySucursal.execute.mockReturnValue(of({ id: 1, idUsuario: 7, idSucursal: 5 }));

      facade.updateMySucursal(5).subscribe();

      expect(updateMySucursal.execute).toHaveBeenCalledWith(5);
      expect(facade.sucursalId()).toBe(5);
    });

    it('updateMySucursal propaga el error y no cambia la sucursal', () => {
      const error = new Error('400');
      updateMySucursal.execute.mockReturnValue(throwError(() => error));
      let received: unknown;

      facade.updateMySucursal(99).subscribe({ error: (e) => (received = e) });

      expect(received).toBe(error);
      expect(facade.sucursalId()).toBeNull();
    });
  });

  describe('logout', () => {
    it('limpia la sesión, la sucursal y el storage', () => {
      const sessionState = TestBed.inject(SessionStateService);
      sessionState.setSession(new Session('a', 'r', 0, 0, '1', UserRole.Admin, 'user'));
      sessionState.setSucursalId(2);
      expect(facade.isAuthenticated()).toBe(true);

      facade.logout();

      expect(facade.isAuthenticated()).toBe(false);
      expect(facade.username()).toBe('');
      expect(facade.role()).toBeNull();
      expect(facade.sucursalId()).toBeNull();
      expect(storage.removeItem).toHaveBeenCalledWith('session');
      expect(loggerPort.info).toHaveBeenCalledWith('User logged out');
    });
  });
});
