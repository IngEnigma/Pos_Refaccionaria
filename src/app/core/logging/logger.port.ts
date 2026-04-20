import { inject, InjectionToken } from '@angular/core';
import { LoggerPort } from './log.model';
import { LoggerService } from './logger.service';

export type { LoggerPort } from './log.model';

export const LOGGER_PORT = new InjectionToken<LoggerPort>('LOGGER_PORT', {
  providedIn: 'root',
  factory: () => inject(LoggerService)
});