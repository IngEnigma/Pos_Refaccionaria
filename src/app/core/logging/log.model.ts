import { LogLevel } from "@core/logging/log-level.enum";

export interface LoggerPort {
  debug(message: string, data?: unknown, context?: string): void;
  info(message: string, data?: unknown, context?: string): void;
  warn(message: string, data?: unknown, context?: string): void;
  error(message: string, data?: unknown, context?: string): void;
  fatal(message: string, data?: unknown, context?: string): void;
  withContext(context: string): LoggerPort;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}
