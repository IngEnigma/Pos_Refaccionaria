import { HttpErrorResponse } from '@angular/common/http';
import { RETRYABLE_CODES_STATUSES } from '@core/config/http-retry.config';

export function canRetryRequest(
  method: string,
  error: unknown,
): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  const isGetRequest = method === 'GET';
  const isRetryableStatus = RETRYABLE_CODES_STATUSES.includes(error.status);

  return isGetRequest && isRetryableStatus;
}

export function getExponentialBackoffDelay(
  retryCount: number,
  baseDelayMs: number,
): number {
  return Math.pow(2, retryCount) * baseDelayMs;
}
