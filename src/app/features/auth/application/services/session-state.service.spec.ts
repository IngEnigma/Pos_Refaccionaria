import { TestBed } from '@angular/core/testing';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';

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

  describe('con storages en memoria (sesión y persistente separados)', () => {
    const now = () => Math.floor(Date.now() / 1000);
    const primitives = (overrides: Record<string, unknown> = {}) => ({
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: now() + 3600,
      refreshExp: now() + 7200,
      userId: 'u-1',
      role: UserRole.Seller,
      username: 'cajero',
      ...overrides,
    });
    const jwtWithExp = (exp: number) => `h.${btoa(JSON.stringify({ exp }))}.s`;

    let sessionStore: StoragePort;
    let persistentStore: StoragePort;

    function setup(seedPersistent?: (store: StoragePort) => void): SessionStateService {
      TestBed.configureTestingModule({
        providers: [
          SessionStateService,
          { provide: STORAGE_PORT, useClass: InMemoryStorageService },
          { provide: PERSISTENT_STORAGE_PORT, useClass: InMemoryStorageService },
          { provide: LOGGER_PORT, useValue: loggerSpy },
        ],
      });
      sessionStore = TestBed.inject(STORAGE_PORT);
      persistentStore = TestBed.inject(PERSISTENT_STORAGE_PORT);
      seedPersistent?.(persistentStore);
      return TestBed.inject(SessionStateService);
    }

    const rememberedWith = (value: unknown) => (store: StoragePort) => {
      store.setItem('session:remember', 'true');
      store.setJSON('session', value);
    };

    const buildSession = () =>
      new Session('access', 'refresh', now() + 3600, now() + 7200, 'u-1', UserRole.Seller, 'cajero');

    describe('arranque', () => {
      it('sin bandera "remember" ignora la sesión persistida', () => {
        const service = setup((store) => store.setJSON('session', primitives()));

        expect(service.getSession()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      it('carga la sesión recordada y la copia al storage de sesión', () => {
        const service = setup(rememberedWith(primitives()));

        expect(service.getSession()?.username).toBe('cajero');
        expect(service.role()).toBe(UserRole.Seller);
        expect(service.isAuthenticated()).toBe(true);
        expect(sessionStore.getJSON('session')).toEqual(primitives({ accessExp: service.session()!.accessExp }));
      });

      it('migra el formato legado (accesExp) al actual (accessExp)', () => {
        const { accessExp, ...rest } = primitives();
        const service = setup(rememberedWith({ ...rest, accesExp: accessExp }));

        expect(service.session()?.accessExp).toBe(accessExp);
        expect(sessionStore.getJSON<Record<string, unknown>>('session')).toEqual(
          expect.objectContaining({ accessExp }),
        );
        expect(sessionStore.getJSON<Record<string, unknown>>('session')).not.toHaveProperty('accesExp');
      });

      it('sesión expirada en storage: no la carga y limpia sesión + bandera persistidas', () => {
        const service = setup(rememberedWith(primitives({ accessExp: now() - 10 })));

        expect(service.getSession()).toBeNull();
        expect(persistentStore.getItem('session')).toBeNull();
        expect(persistentStore.getItem('session:remember')).toBeNull();
        expect(loggerSpy.warn).toHaveBeenCalled();
      });

      it('JSON corrupto en storage: arranca sin sesión y sin lanzar', () => {
        const service = setup((store) => {
          store.setItem('session:remember', 'true');
          store.setItem('session', '{no es json');
        });

        expect(service.getSession()).toBeNull();
      });

      it('contenido persistido que no es una sesión: arranca sin sesión, registra el error y no lanza', () => {
        const service = setup(rememberedWith('basura'));

        expect(service.getSession()).toBeNull();
        expect(loggerSpy.error).toHaveBeenCalledWith(
          'Failed to parse session from storage',
          expect.anything(),
        );
      });

      it('objeto persistido sin access token se trata como expirado y se limpia', () => {
        const service = setup(rememberedWith({ userId: 'x' }));

        expect(service.getSession()).toBeNull();
        expect(persistentStore.getItem('session')).toBeNull();
      });
    });

    describe('setSession', () => {
      it('sin persist solo actualiza memoria', () => {
        const service = setup();

        service.setSession(buildSession());

        expect(service.getSession()?.userId).toBe('u-1');
        expect(sessionStore.getItem('session')).toBeNull();
        expect(persistentStore.getItem('session')).toBeNull();
      });

      it('persist + remember: guarda en ambos storages y activa la bandera', () => {
        const service = setup();

        service.setSession(buildSession(), { persist: true, remember: true });

        expect(sessionStore.getJSON('session')).toEqual(buildSession().toPrimitives());
        expect(persistentStore.getJSON('session')).toEqual(buildSession().toPrimitives());
        expect(persistentStore.getItem('session:remember')).toBe('true');
      });

      it('persist sin remember: solo storage de sesión y borra lo persistente previo', () => {
        const service = setup();
        persistentStore.setItem('session:remember', 'true');
        persistentStore.setJSON('session', primitives());

        service.setSession(buildSession(), { persist: true, remember: false });

        expect(sessionStore.getJSON('session')).toEqual(buildSession().toPrimitives());
        expect(persistentStore.getItem('session')).toBeNull();
        expect(persistentStore.getItem('session:remember')).toBeNull();
      });

      it('persist sin indicar remember conserva la decisión anterior', () => {
        const service = setup(rememberedWith(primitives()));

        service.setSession(buildSession(), { persist: true });

        expect(persistentStore.getItem('session:remember')).toBe('true');
        expect(persistentStore.getJSON('session')).toEqual(buildSession().toPrimitives());
      });
    });

    describe('updateAccessToken', () => {
      it('sin sesión no hace nada', () => {
        const service = setup();

        service.updateAccessToken(jwtWithExp(now() + 100));

        expect(service.getSession()).toBeNull();
        expect(sessionStore.getItem('session')).toBeNull();
      });

      it('renueva access token y exp, conserva el resto y persiste', () => {
        const service = setup();
        service.setSession(buildSession(), { persist: true, remember: true });
        const exp = now() + 900;
        const token = jwtWithExp(exp);

        service.updateAccessToken(token);

        expect(service.session()).toEqual(
          expect.objectContaining({ accessToken: token, accessExp: exp, refreshToken: 'refresh', userId: 'u-1' }),
        );
        expect(persistentStore.getJSON<{ accessToken: string }>('session')?.accessToken).toBe(token);
      });
    });

    describe('clearSession (logout)', () => {
      it('limpia memoria, sucursal y ambos storages', () => {
        const service = setup();
        service.setSession(buildSession(), { persist: true, remember: true });
        service.setSucursalId(4);

        service.clearSession();

        expect(service.getSession()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(service.currentSucursalId()).toBeNull();
        expect(sessionStore.getItem('session')).toBeNull();
        expect(persistentStore.getItem('session')).toBeNull();
        expect(persistentStore.getItem('session:remember')).toBeNull();
      });

      it('tras el logout un nuevo arranque no recupera la sesión', () => {
        const service = setup();
        service.setSession(buildSession(), { persist: true, remember: true });
        service.clearSession();

        expect(TestBed.inject(PERSISTENT_STORAGE_PORT).getItem('session:remember')).toBeNull();
        expect(service.username()).toBe('');
        expect(service.role()).toBeNull();
      });
    });

    describe('estado derivado', () => {
      it('sin sesión: usuario vacío, rol nulo, no autenticado', () => {
        const service = setup();

        expect(service.username()).toBe('');
        expect(service.role()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
      });

      it('sesión en memoria con access token vencido no cuenta como autenticada', () => {
        const service = setup();

        service.setSession(
          new Session('access', 'refresh', now() - 5, now() + 100, 'u-1', UserRole.Admin, 'admin'),
        );

        expect(service.isAuthenticated()).toBe(false);
        expect(service.role()).toBe(UserRole.Admin);
      });

      it('setSucursalId guarda y permite limpiar la sucursal activa', () => {
        const service = setup();

        service.setSucursalId(9);
        expect(service.currentSucursalId()).toBe(9);

        service.setSucursalId(null);
        expect(service.currentSucursalId()).toBeNull();
      });
    });
  });
});
