import { InjectionToken, Signal } from '@angular/core';

export const SHELL_USERNAME = new InjectionToken<Signal<string | null>>(
  'SHELL_USERNAME',
);

export const SHELL_IS_AUTHENTICATED = new InjectionToken<Signal<boolean>>(
  'SHELL_IS_AUTHENTICATED',
);

export const SHELL_LOGOUT = new InjectionToken<() => void>('SHELL_LOGOUT');
