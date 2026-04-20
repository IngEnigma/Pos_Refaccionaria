import { HttpStatusCode } from '@angular/common/http';
import { RetryConfig } from '../http/retry/retry-config.interface';

export const RETRYABLE_CODES_STATUSES = [
  0,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout,   
] as const;

export const HTTP_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 500,
  retryableMethods: ['GET'] as readonly string[],
};