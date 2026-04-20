import { InjectionToken } from '@angular/core';
import { LogLevel } from './log-level.enum';

export const LOGGING_LEVEL_TOKEN = new InjectionToken<LogLevel>(
  'LOGGING_LEVEL_TOKEN',
  {
    providedIn: 'root',
    factory: () => LogLevel.DEBUG,
  }
);
