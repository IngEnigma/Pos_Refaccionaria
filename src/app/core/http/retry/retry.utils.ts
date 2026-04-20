import { HttpErrorResponse } from '@angular/common/http';

import { RETRYABLE_CODES_STATUSES } from '@core/config/http-retry.config';

export function canRetryRequest(
  method: string,
  error: unknown,
  retryableMethods: readonly string[],
): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  const isRetryableMethod = retryableMethods.includes(method);
  const isRetryableStatus = (RETRYABLE_CODES_STATUSES as ReadonlyArray<number>).includes(error.status);

  return isRetryableMethod && isRetryableStatus;
}

export function getExponentialBackoffDelay(
  retryCount: number,
  baseDelayMs: number,
): number {
  const exponentialDelay = Math.pow(2, retryCount) * baseDelayMs;
  const jitter = Math.random() * baseDelayMs;

  return exponentialDelay + jitter;
}
