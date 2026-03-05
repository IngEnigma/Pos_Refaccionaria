import { HttpStatusCode } from '@angular/common/http';

export const RETRYABLE_CODES_STATUSES = [
  0,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout,   
] as const;

export const HTTP_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 500,
} as const;