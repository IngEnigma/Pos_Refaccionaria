import { inject, Injectable } from '@angular/core';

import { LoggerPort, LOGGER_PORT } from '@core/logging/logger.port';
import { StoragePort } from '@core/ports/storage.port';
import { LOCAL_STORAGE } from '@core/tokens/storage.token';

@Injectable()
export class LocalStorageService implements StoragePort {
  private readonly storage = inject(LOCAL_STORAGE);
  private readonly logger: LoggerPort = inject(LOGGER_PORT).withContext(
    'LocalStorageService',
  );

  getItem(key: string): string | null {
    try {
      const data = this.storage.getItem(key);
      return data;
    } catch (error) {
      this.logger.error('Error retrieving key', { key, error });
      return null;
    }
  }

  getJSON<T>(key: string): T | null {
    const data = this.getItem(key);
    if (!data) {
      this.logger.debug('Key not found', { key });
      return null;
    }
    try {
      const json = JSON.parse(data) as T;
      return json;
    } catch (error) {
      this.logger.error('Error parsing key', { key, error });
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
      this.logger.debug('Key stored successfully', { key });
    } catch (error) {
      this.logger.error('Error storing key', { key, error });
    }
  }

  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Error setting key', { key, error });
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
      this.logger.debug('Key removed successfully', { key });
    } catch (error) {
      this.logger.error('Error removing key', { key, error });
    }
  }

  clear(): void {
    try {
      this.storage.clear();
      this.logger.debug('Storage cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing storage', { error });
    }
  }
}
