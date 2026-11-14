import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { RefreshTokenUseCase } from './refresh.usecase';

const now = () => Math.floor(Date.now() / 1000);

function jwtWithExp(exp: number): string {
  return `h.${btoa(JSON.stringify({ exp }))}.s`;
}

function buildSession(overrides: { refreshToken?: string | null; refreshExp?: number } = {}): Session {
  return new Session(
    'old-access',
    'refreshToken' in overrides ? overrides.refreshToken! : 'refresh',
    now() - 10,
    overrides.refreshExp ?? now() + 7200,
    'u-1',
    UserRole.Seller,
    'cajero',
  );
}

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let repository: jest.Mocked<Pick<AuthRepository, 'refresh'>>;
  let sessionService: jest.Mocked<Pick<SessionStateService, 'getSession' | 'setSession' | 'clearSession'>>;
  let logger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    repository = { refresh: jest.fn() };
    sessionService = { getSession: jest.fn(), setSession: jest.fn(), clearSession: jest.fn() };
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: AuthRepository, useValue: repository },
        { provide: SessionStateService, useValue: sessionService },
        { provide: LOGGER_PORT, useValue: logger },
      ],
    });

    useCase = TestBed.inject(RefreshTokenUseCase);
  });

  describe('sin refresh token utilizable', () => {
    it.each([
      ['no hay sesión', null],
      ['la sesión no tiene refresh token', buildSession({ refreshToken: null })],
      ['el refresh token ya expiró', buildSession({ refreshExp: now() - 10 })],
    ])('%s: limpia la sesión y falla sin llamar al backend', async (_caso, session) => {
      sessionService.getSession.mockReturnValue(session);

      await expect(firstValueFrom(useCase.execute())).rejects.toThrow(
        'Session expired. Refresh token unavailable.',
      );

      expect(sessionService.clearSession).toHaveBeenCalledTimes(1);
      expect(repository.refresh).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('con refresh token vigente', () => {
    it('renueva el access token, decodifica su exp y persiste la sesión', async () => {
      const exp = now() + 3600;
      const newAccess = jwtWithExp(exp);
      sessionService.getSession.mockReturnValue(buildSession());
      repository.refresh.mockReturnValue(of(newAccess));

      const result = await firstValueFrom(useCase.execute());

      expect(repository.refresh).toHaveBeenCalledWith('refresh');
      expect(result.accessToken).toBe(newAccess);
      expect(result.accessExp).toBe(exp);
      expect(result.refreshToken).toBe('refresh');
      expect(result.userId).toBe('u-1');
      expect(result.role).toBe(UserRole.Seller);
      expect(sessionService.setSession).toHaveBeenCalledWith(result, { persist: true });
      expect(sessionService.clearSession).not.toHaveBeenCalled();
    });

    it('si el nuevo token no trae exp legible, deja accessExp en 0', async () => {
      sessionService.getSession.mockReturnValue(buildSession());
      repository.refresh.mockReturnValue(of('token-opaco'));

      const result = await firstValueFrom(useCase.execute());

      expect(result.accessExp).toBe(0);
    });

    it('si el backend rechaza el refresh: limpia la sesión y relanza el mismo error', async () => {
      const error = new Error('401 refresh');
      sessionService.getSession.mockReturnValue(buildSession());
      repository.refresh.mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);

      expect(sessionService.clearSession).toHaveBeenCalledTimes(1);
      expect(sessionService.setSession).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Refresh token failed', error);
    });
  });
});
