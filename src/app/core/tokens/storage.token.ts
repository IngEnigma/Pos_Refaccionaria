import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

class NoopStorage implements Storage {
  [name: string]: any;
  length = 0;
  clear(): void {}
  getItem(): string | null { return null; }
  key(): string | null { return null; }
  removeItem(): void {}
  setItem(): void {}
}

export const LOCAL_STORAGE = new InjectionToken<Storage>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window.localStorage : new NoopStorage();
  },
});
