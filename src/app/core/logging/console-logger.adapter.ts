import { Injectable } from '@angular/core';
import { LoggerAdapter } from './logger.adapter';
import { LogEntry } from './log.model';
import { LogLevel } from './log-level.enum';

@Injectable({ providedIn: 'root' })
export class ConsoleLoggerAdapter implements LoggerAdapter {
  log(entry: LogEntry): void {
    const { level, message, data, context, timestamp } = entry;
    const styleSource = this.getStyle(level);
    const label = LogLevel[level];
    
    // Structured format with styles for the label
    const header = `%c${timestamp} [${label}]%c${context ? ` (${context})` : ''}: ${message}`;
    const consoleArgs: any[] = [header, styleSource, ''];

    if (data !== undefined) {
      consoleArgs.push(data);
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(...consoleArgs);
        break;
      case LogLevel.INFO:
        console.info(...consoleArgs);
        break;
      case LogLevel.WARN:
        console.warn(...consoleArgs);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(...consoleArgs);
        break;
      default:
        console.log(...consoleArgs);
    }
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'color: #7f8c8d; font-weight: 500';
      case LogLevel.INFO: return 'color: #2ecc71; font-weight: bold';
      case LogLevel.WARN: return 'color: #f39c12; font-weight: bold';
      case LogLevel.ERROR:
      case LogLevel.FATAL: return 'color: #e74c3c; font-weight: bold; text-transform: uppercase';
      default: return 'color: inherit';
    }
  }
}
