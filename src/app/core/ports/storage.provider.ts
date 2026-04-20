import { Provider, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { STORAGE_PORT } from './storage.port';
import { LocalStorageService } from '../services/local-storage.service';
import { InMemoryStorageService } from '../services/in-memory-storage.service';
import { LOCAL_STORAGE } from '@core/tokens/storage.token';
import { LOGGER_PORT } from '../logging/logger.port';

export const provideStorage = (): Provider[] => [
  LocalStorageService,
  InMemoryStorageService,
  {
    provide: STORAGE_PORT,
    useFactory: () => {
      const platformId = inject(PLATFORM_ID);
      
      if (isPlatformBrowser(platformId)) {
        const storage = inject(LOCAL_STORAGE);
        try {
          storage.setItem('__test__', '1');
          storage.removeItem('__test__');
          return inject(LocalStorageService);
        } catch (error) {
          inject(LOGGER_PORT).warn('localStorage is not available, falling back to InMemoryStorageService', { error });
          return inject(InMemoryStorageService);
        }
      }
      
      return inject(InMemoryStorageService);
    }
  }
];
