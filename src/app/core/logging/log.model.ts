import { LogLevel } from "@core/logging/log-level.enum";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}