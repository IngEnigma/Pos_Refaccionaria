import { inject, Injectable, InjectionToken } from '@angular/core';

import { LogLevel } from '@core/logging/log-level.enum';
import { LogEntry } from '@core/logging/log.model';
import { LoggerPort } from './log.model';
import { LoggerAdapter } from './logger.adapter';
import { ConsoleLoggerAdapter } from './console-logger.adapter';
import { ContextualLogger } from './contextual-logger';
import { LOGGING_LEVEL_TOKEN } from './logging-level.token';

export const LOGGER_ADAPTERS = new InjectionToken<LoggerAdapter[]>('LOGGER_ADAPTERS', {
  providedIn: 'root',
  factory: () => [inject(ConsoleLoggerAdapter)]
});

@Injectable({ providedIn: 'root' })
export class LoggerService implements LoggerPort {
  private readonly adapters = inject(LOGGER_ADAPTERS);
  private readonly currentLevel = inject(LOGGING_LEVEL_TOKEN);

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string) {
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    this.adapters.forEach(adapter => adapter.log(entry));
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  info(message: string, data?: unknown, context?: string) {
    this.log(LogLevel.INFO, message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log(LogLevel.WARN, message, data, context);
  }

  error(message: string, data?: unknown, context?: string) {
    this.log(LogLevel.ERROR, message, data, context);
  }

  fatal(message: string, data?: unknown, context?: string) {
    this.log(LogLevel.FATAL, message, data, context);
  }

  withContext(context: string): LoggerPort {
    return new ContextualLogger(this, context);
  }
}
