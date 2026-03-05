import { Injectable, Inject } from '@angular/core';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LogLevel } from '@app/core/logging/log-level.enum';
import { LogEntry } from '@app/core/logging/log.model';
import { LoggerPort } from './logger.port';

@Injectable({ providedIn: 'root' })
export class LoggerService implements LoggerPort {
  private currentLevel: LogLevel;

  constructor(@Inject(APP_ENV) private env: Environment) {
    this.currentLevel = this.env.loggingLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };
  }

  private format(entry: LogEntry): string {
    const { timestamp, level, context, message, data } = entry;
    const levelName = LogLevel[level];
    let base = `${timestamp} [${levelName}]`;
    if (context) base += ` (${context})`;
    base += `: ${message}`;
    if (data) {
      try {
        base += ` -- ${JSON.stringify(data)}`;
      } catch {
        base += ` -- [Could not serialize data]`;
      }
    }
    return base;
  }

  private logToConsole(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.format(entry);
    switch (entry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string,
  ) {
    const entry = this.createEntry(level, message, data, context);
    this.logToConsole(entry);
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log(0, message, data, context);
  }

  info(message: string, data?: unknown, context?: string) {
    this.log(1, message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log(2, message, data, context);
  }

  error(message: string, data?: unknown, context?: string) {
    this.log(3, message, data, context);
  }

  fatal(message: string, data?: unknown, context?: string) {
    this.log(4, message, data, context);
  }

  withContext(context: string): LoggerPort {
    return {
      debug: (msg: string, data?: unknown) => this.debug(msg, data, context),
      info: (msg: string, data?: unknown) => this.info(msg, data, context),
      warn: (msg: string, data?: unknown) => this.warn(msg, data, context),
      error: (msg: string, data?: unknown) => this.error(msg, data, context),
      fatal: (msg: string, data?: unknown) => this.fatal(msg, data, context),
    };
  }
}
