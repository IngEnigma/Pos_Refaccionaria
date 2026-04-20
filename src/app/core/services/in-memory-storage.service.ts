import { inject, Injectable } from '@angular/core';

import { LoggerPort, LOGGER_PORT } from '@core/logging/logger.port';
import { StoragePort } from '@core/ports/storage.port';

@Injectable({ providedIn: 'root' })
export class InMemoryStorageService implements StoragePort {
  private readonly logger: LoggerPort = inject(LOGGER_PORT).withContext(
    'InMemoryStorageService',
  );
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    const value = this.store.get(key) ?? null;
    return value;
  }

  getJSON<T>(key: string): T | null {
    const data = this.getItem(key);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error('Error parsing in-memory JSON', { key, error });
      return null;
    }
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Error setting in-memory JSON', { key, error });
    }
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
