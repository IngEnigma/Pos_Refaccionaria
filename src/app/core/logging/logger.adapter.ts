import { LogEntry } from './log.model';

export interface LoggerAdapter {
  log(entry: LogEntry): void;
}
