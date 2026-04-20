import { TestBed } from '@angular/core/testing';

import { LoggerPort, LOGGER_PORT } from '@core/logging/logger.port';
import { STORAGE_PORT, StoragePort, PERSISTENT_STORAGE_PORT } from '@core/ports/storage.port';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { SessionStateService } from './session-state.service';

describe('SessionStateService', () => {
  let storageSpy: jest.Mocked<StoragePort>;
  let loggerSpy: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    storageSpy = {
      getItem: jest.fn(),
      getJSON: jest.fn(),
      setItem: jest.fn(),
      setJSON: jest.fn(),
      removeItem: jest.fn(),
    } as unknown as jest.Mocked<StoragePort>;

    loggerSpy = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;
  });

  function configureTestingModule(): void {
    TestBed.configureTestingModule({
      providers: [
        SessionStateService,
        { provide: STORAGE_PORT, useValue: storageSpy },
        { provide: PERSISTENT_STORAGE_PORT, useValue: storageSpy },
        {
          provide: LOGGER_PORT,
          useValue: loggerSpy,
        },
      ],
    });
  }

  it('loads a valid session from storage on startup', () => {
    const now = Math.floor(Date.now() / 1000);
    storageSpy.getItem.mockImplementation((key) => {
      if (key === 'session:remember') return 'true';
      return null;
    });
    storageSpy.getJSON.mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: now + 3600,
      refreshExp: now + 7200,
      userId: 'u-1',
      role: UserRole.Admin,
    });

    configureTestingModule();
    const service = TestBed.inject(SessionStateService);

    expect(service.getSession()?.userId).toBe('u-1');
    expect(storageSpy.removeItem).not.toHaveBeenCalled();
  });

  it('clears persisted session when access token is expired', () => {
    const now = Math.floor(Date.now() / 1000);
    storageSpy.getItem.mockImplementation((key) => {
      if (key === 'session:remember') return 'true';
      return null;
    });
    storageSpy.getJSON.mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: now - 10,
      refreshExp: now + 7200,
      userId: 'u-1',
      role: UserRole.Admin,
    });

    configureTestingModule();
    const service = TestBed.inject(SessionStateService);

    expect(service.getSession()).toBeNull();
    expect(storageSpy.removeItem).toHaveBeenCalledWith('session');
  });

  it('persists session when setSession is called with persist=true', () => {
    storageSpy.getJSON.mockReturnValue(null);
    configureTestingModule();
    const service = TestBed.inject(SessionStateService);
    const now = Math.floor(Date.now() / 1000);

    service.setSession(
      new Session('access', 'refresh', now + 3600, now + 7200, 'u-1', UserRole.Manager, 'testuser'),
      { persist: true },
    );

    expect(storageSpy.setJSON).toHaveBeenCalled();
  });
});
