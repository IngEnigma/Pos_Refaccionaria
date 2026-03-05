import { Injectable } from '@angular/core';

import { LoggerService } from '@core/logging/logger.service';
import { LoggerPort } from '@core/logging/logger.port';
import { StoragePort } from '@core/ports/storage.port';

@Injectable({ providedIn: 'root' })
export class LocalStorageService implements StoragePort {
  private readonly logger: LoggerPort;

/**
 * Constructor for the LocalStorageService.
 * @param loggerService - The logger service to use for logging.
 * Sets up a logger with the context of 'LocalStorageService'.
 */
  constructor(private loggerService: LoggerService) {
    this.logger = this.loggerService.withContext('LocalStorageService');
  }

/**
 * Returns the storage object if it is available, otherwise returns null.
 * The storage object is not available when running in a server-side environment.
 * @returns The storage object if it is available, otherwise null.
 */
  private get storage(): Storage | null {
    return typeof window !== 'undefined' ? window.localStorage : null;
  }

/**
 * Retrieves a value from the storage object.
 * @param key - The key of the value to retrieve from the storage object.
 * @returns The value associated with the key, or null if the key does not exist or the storage object is unavailable.
 * Logs a warning if the storage object is unavailable, and logs an error if there is an error while retrieving the value from the storage object.
 */
  getItem(key: string): string | null {
    if (!this.storage) {
      this.logger.warn('Storage is unavailable', { key });
      return null;
    }
    try {
      const data = this.storage.getItem(key);
      this.logger.debug('Key retrieved successfully', { key });
      return data;
    } catch (error) {
      this.logger.error('Error retrieving key', { key, error });
      return null;
    }
  }

/**
 * Retrieves a JSON value from the storage object.
 * @param key - The key of the JSON value to retrieve from the storage object.
 * @returns The JSON value associated with the key, or null if the key does not exist or the storage object is unavailable, or if there is an error while retrieving the value from the storage object.
 * Logs a warning if the storage object is unavailable, logs a debug message if the key is not found, logs an error if there is an error while retrieving the value from the storage object.
 * @template T The type of the JSON value to retrieve.
 */
  getJSON<T>(key: string): T | null {
    const data = this.getItem(key);
    if (!data) {
      this.logger.debug('Key not found', { key });
      return null;
    }
    try {
      const json = JSON.parse(data) as T;
      this.logger.debug('Key parsed successfully', { key });
      return json;
    } catch (error) {
      this.logger.error('Error parsing key', { key, error });
      return null;
    }
  }

  /**
   * Stores a value in the storage object.
   * @param key - The key of the value to store in the storage object.
   * @param value - The value to store in the storage object.
   * Logs a warning if the storage object is unavailable, logs an info message if the key is stored successfully, logs an error if there is an error while storing the key.
   */
  setItem(key: string, value: string): void {
    if (!this.storage) {
      this.logger.warn('Storage is unavailable', { key });
      return;
    }
    try {
      this.storage.setItem(key, value);
      this.logger.info('Key stored successfully', { key });
    } catch (error) {
      this.logger.error('Error storing key', { key, error });
    }
  }

/**
 * Stores a JSON value in the storage object.
 * @param key - The key of the JSON value to store in the storage object.
 * @param value - The JSON value to store in the storage object.
 * Logs an error if there is an error while storing the key.
 */
  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      this.logger.error('Error setting key', { key, error });
    }
  }

  /**
   * Removes a key from the storage object.
   * @param key - The key of the value to remove from the storage object.
   * Logs a warning if the storage object is unavailable, logs an info message if the key is removed successfully, logs an error if there is an error while removing the key.
   */
  removeItem(key: string): void {
    if (!this.storage) {
      this.logger.warn('Storage is unavailable', { key });
      return;
    }
    try {
      this.storage.removeItem(key);
      this.logger.info('Key removed successfully', { key });
    } catch (error) {
      this.logger.error('Error removing key', { key, error });
    }
  }
}
