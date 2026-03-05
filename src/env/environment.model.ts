import { LogLevel } from "@app/core/logging/log-level.enum";

export interface Environment {
  production: boolean;
  loggingLevel: LogLevel;
  apiUrl: string;
}