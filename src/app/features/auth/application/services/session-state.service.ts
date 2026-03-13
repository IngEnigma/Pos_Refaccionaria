import { computed, inject, Injectable, signal } from '@angular/core';

import { SessionMapper } from '@features/auth/infrastructure/mappers/auth-session.mapper';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { STORAGE_PORT, StoragePort } from '@core/ports/storage.port';
import { LoggerService } from '@core/logging/logger.service';
import { LoggerPort } from '@core/logging/logger.port';
import { JwtUtils } from '@core/utils/jwt.utils';

type SessionPrimitives = ReturnType<typeof SessionMapper.toJSON>;

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  private readonly _session = signal<Session | null>(null);
  private readonly STORAGE_KEY = 'session';
  private readonly logger: LoggerPort = inject(LoggerService).withContext(
    'SessionStateService',
  );
  private readonly storage = inject<StoragePort>(STORAGE_PORT);
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => {
    const session = this.session();
    if (!session) return false;
    return session?.isAuthenticated ?? false;
  });

  /**
   * Loads persisted session state when the service starts.
   */
  constructor() {
    const sessionJson = this.storage.getJSON<SessionPrimitives>(
      this.STORAGE_KEY,
    );
    if (sessionJson) {
      try {
        const session = SessionMapper.fromJSON(sessionJson);
        if (session.isAccessTokenExpired()) {
          this.storage.removeItem(this.STORAGE_KEY);
          this.logger.warn('Stored session was expired and has been cleared');
        } else {
          this._session.set(session);
          this.logger.info('Session loaded from storage');
        }
      } catch (error) {
        this.logger.error('Failed to parse session from storage', error);
      }
    }
  }

  /**
   * Persists the session to storage.
   * If the session is null, the stored session is cleared from storage.
   * Otherwise, the session is converted to its primitives and stored in storage.
   * @param session - The session to persist to storage, or null to clear the stored session.
   */
  private persistSession(session: Session | null) {
    if (!session) {
      this.storage.removeItem(this.STORAGE_KEY);
      this.logger.info('Session cleared from storage');
      return;
    }
    const primitives = SessionMapper.toJSON(session);
    this.logger.debug('Persisting session to storage');
    this.storage.setJSON(this.STORAGE_KEY, primitives);
  }

  /**
   * Updates the access token in the current session.
   *
   * @param newAccessToken - The new access token to use.
   *
   * If there is no current session, this method does nothing.
   * Otherwise, it updates the access token in the current session and persists the session to storage.
   */
  updateAccessToken(newAccessToken: string) {
    const current = this.session();
    if (!current) return;

    this.logger.debug('Updating access token');
    const accessExp = JwtUtils.decodeExpiration(newAccessToken);
    const updated = current.updateAccessToken(newAccessToken, accessExp);
    this.setSession(updated, { persist: true });
  }

  /**
   * Sets the current session.
   * If the session is null, the stored session is cleared from storage.
   * Otherwise, the session is converted to its primitives and stored in storage.
   * @param session - The session to set, or null to clear the stored session.
   * @param options - An optional object containing a single property: persist.
   * If persist is true, the session is persisted to storage.
   */
  setSession(session: Session | null, options?: { persist?: boolean }) {
    this._session.set(session);

    this.logger.debug('Setting session');
    if (options?.persist) {
      this.persistSession(session);
    }
  }

  /**
   * Retrieves the current session from storage.
   *
   * If there is a current session, it is returned and a debug message is logged.
   * Otherwise, null is returned and a debug message is logged.
   *
   * @returns The current session, or null if there is no current session.
   */
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

  /**
   * Clears the current session by setting it to null and persisting the change to storage.
   * A debug message is logged when the session is cleared.
   */
  clearSession() {
    this.setSession(null, { persist: true });
    this.logger.info('Session cleared');
  }
}
