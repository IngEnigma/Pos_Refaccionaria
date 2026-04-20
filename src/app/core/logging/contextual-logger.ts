import { LoggerPort } from './log.model';

export class ContextualLogger implements LoggerPort {
  constructor(
    private readonly base: LoggerPort,
    private readonly context: string
  ) {}

  debug(message: string, data?: unknown, context?: string): void {
    this.base.debug(message, data, this.buildContext(context));
  }

  info(message: string, data?: unknown, context?: string): void {
    this.base.info(message, data, this.buildContext(context));
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.base.warn(message, data, this.buildContext(context));
  }

  error(message: string, data?: unknown, context?: string): void {
    this.base.error(message, data, this.buildContext(context));
  }

  fatal(message: string, data?: unknown, context?: string): void {
    this.base.fatal(message, data, this.buildContext(context));
  }

  withContext(context: string): LoggerPort {
    return new ContextualLogger(this, context);
  }

  private buildContext(context?: string): string {
    return context ? `${this.context}:${context}` : this.context;
  }
}
