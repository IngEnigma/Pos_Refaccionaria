import { TestBed } from '@angular/core/testing';

import { LoggerPort } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { STORAGE_PORT, StoragePort } from '@core/ports/storage.port';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { SessionService } from './session-state.service';

describe('SessionService', () => {
  let storageSpy: jasmine.SpyObj<StoragePort>;
  let loggerSpy: jasmine.SpyObj<LoggerPort>;

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj<StoragePort>('StoragePort', [
      'getItem',
      'getJSON',
      'setItem',
      'setJSON',
      'removeItem',
    ]);

    loggerSpy = jasmine.createSpyObj<LoggerPort>('LoggerPort', [
      'debug',
      'info',
      'warn',
      'error',
      'fatal',
    ]);
  });

  function configureTestingModule(): void {
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: STORAGE_PORT, useValue: storageSpy },
        {
          provide: LoggerService,
          useValue: {
            withContext: () => loggerSpy,
          },
        },
      ],
    });
  }

  it('loads a valid session from storage on startup', () => {
    const now = Math.floor(Date.now() / 1000);
    storageSpy.getJSON.and.returnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: now + 3600,
      refreshExp: now + 7200,
      userId: 'u-1',
      role: UserRole.Admin,
    });

    configureTestingModule();
    const service = TestBed.inject(SessionService);

    expect(service.getSession()?.userId).toBe('u-1');
    expect(storageSpy.removeItem).not.toHaveBeenCalled();
  });

  it('clears persisted session when access token is expired', () => {
    const now = Math.floor(Date.now() / 1000);
    storageSpy.getJSON.and.returnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: now - 10,
      refreshExp: now + 7200,
      userId: 'u-1',
      role: UserRole.Admin,
    });

    configureTestingModule();
    const service = TestBed.inject(SessionService);

    expect(service.getSession()).toBeNull();
    expect(storageSpy.removeItem).toHaveBeenCalledWith('session');
  });

  it('persists session when setSession is called with persist=true', () => {
    storageSpy.getJSON.and.returnValue(null);
    configureTestingModule();
    const service = TestBed.inject(SessionService);
    const now = Math.floor(Date.now() / 1000);

    service.setSession(
      new Session('access', 'refresh', now + 3600, now + 7200, 'u-1', UserRole.Manager),
      { persist: true },
    );

    expect(storageSpy.setJSON).toHaveBeenCalled();
  });
});
