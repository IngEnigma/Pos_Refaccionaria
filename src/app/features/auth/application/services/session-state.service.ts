import { computed, inject, Injectable, signal } from '@angular/core';

import { Session, SessionPrimitives, LegacySessionPrimitives } from '@features/auth/domain/entities/auth-session.entity';
import {
  PERSISTENT_STORAGE_PORT,
} from '@core/ports/storage.port';
import { STORAGE_PORT, StoragePort } from '@core/ports/storage.port';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { JwtUtils } from '@core/utils/jwt.utils';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private readonly _session = signal<Session | null>(null);
  private readonly _currentSucursalId = signal<number | null>(null);
  private readonly STORAGE_KEY = 'session';
  private readonly REMEMBER_KEY = 'session:remember';
  private rememberSession = false;
  private readonly logger = inject(LOGGER_PORT).withContext('SessionStateService');
  private readonly storage = inject<StoragePort>(STORAGE_PORT);
  private readonly persistentStorage =
    inject<StoragePort>(PERSISTENT_STORAGE_PORT);
  readonly session = this._session.asReadonly();
  readonly currentSucursalId = this._currentSucursalId.asReadonly();
  readonly isAuthenticated = computed(() => {
    const session = this.session();
    if (!session) return false;
    return session?.isAuthenticated ?? false;
  });
  readonly username = computed(() => {
    const session = this.session();
    return session?.username ?? '';
  });
  readonly role = computed(() => {
    const session = this.session();
    return session?.role ?? null;
  });

  constructor() {
    const shouldRemember =
      this.persistentStorage.getItem(this.REMEMBER_KEY) === 'true';

    if (!shouldRemember) {
      return;
    }

    const sessionJson = this.persistentStorage.getJSON<SessionPrimitives | LegacySessionPrimitives>(
      this.STORAGE_KEY,
    );
    if (sessionJson) {
      try {
        const session = Session.fromPrimitives(sessionJson);
        if (session.isAccessTokenExpired()) {
          this.clearPersistentStorage();
          this.logger.warn('Stored session was expired and has been cleared');
        } else {
          this._session.set(session);
          this.storage.setJSON(this.STORAGE_KEY, session.toPrimitives());
          this.rememberSession = true;
          this.logger.info('Session loaded from storage');
        }
      } catch (error) {
        this.logger.error('Failed to parse session from storage', error);
      }
    }
  }

  private persistSession(
    session: Session | null,
    options?: { remember?: boolean },
  ) {
    const remember = options?.remember ?? this.rememberSession;

    if (!session) {
      this.storage.removeItem(this.STORAGE_KEY);
      this.clearPersistentStorage();
      this.rememberSession = false;
      this.logger.info('Session cleared from storage');
      return;
    }
    const primitives = session.toPrimitives();
    this.logger.debug('Persisting session to storage');
    this.storage.setJSON(this.STORAGE_KEY, primitives);

    if (remember) {
      this.rememberSession = true;
      this.persistentStorage.setItem(this.REMEMBER_KEY, 'true');
      this.persistentStorage.setJSON(this.STORAGE_KEY, primitives);
      return;
    }

    this.rememberSession = false;
    this.clearPersistentStorage();
  }

  updateAccessToken(newAccessToken: string) {
    const current = this.session();
    if (!current) return;

    this.logger.debug('Updating access token');
    const accessExp = JwtUtils.decodeExpiration(newAccessToken);
    const updated = current.updateAccessToken(newAccessToken, accessExp);
    this.setSession(updated, { persist: true });
  }

  setSession(
    session: Session | null,
    options?: { persist?: boolean; remember?: boolean },
  ) {
    this._session.set(session);

    this.logger.debug('Setting session');
    if (options?.persist) {
      this.persistSession(session, { remember: options.remember });
    }
  }

  getSession(): Session | null {
    const session = this.session();
    if (session) {
      this.logger.debug('Session retrieved');
      return session;
    } else {
      this.logger.debug('No session found');
      return null;
    }
  }

  setSucursalId(idSucursal: number | null): void {
    this._currentSucursalId.set(idSucursal);
    this.logger.debug('Sucursal ID set', { idSucursal });
  }

  clearSession() {
    this.setSession(null, { persist: true });
    this._currentSucursalId.set(null);
    this.logger.info('Session cleared');
  }

  private clearPersistentStorage(): void {
    this.persistentStorage.removeItem(this.STORAGE_KEY);
    this.persistentStorage.removeItem(this.REMEMBER_KEY);
  }
}
