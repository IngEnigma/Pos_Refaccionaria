import { InjectionToken } from "@angular/core";

export interface StoragePort {
  getItem(key: string): string | null;
  getJSON<T>(key: string): T | null;
  setItem(key: string, value: string): void;
  setJSON<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

export const STORAGE_PORT = new InjectionToken<StoragePort>('STORAGE_PORT');

export const PERSISTENT_STORAGE_PORT = new InjectionToken<StoragePort>(
  'PERSISTENT_STORAGE_PORT',
);
