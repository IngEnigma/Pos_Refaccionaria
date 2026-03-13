import { Observable, throwError, timer } from 'rxjs';
import { HttpRequest } from '@angular/common/http';

import {
  canRetryRequest,
  getExponentialBackoffDelay,
} from '@core/http/retry/retry.utils';
import { HTTP_RETRY_CONFIG } from '@core/config/http-retry.config';
import { LoggerPort } from '@core/logging/logger.port';

export function createRetryStrategy(
  req: HttpRequest<unknown>,
  logger: LoggerPort,
) {
  return {
    count: HTTP_RETRY_CONFIG.maxRetries,

    delay: (error: unknown, retryCount: number): Observable<number> => {
      if (!canRetryRequest(req.method, error)) {
        return throwError(() => error);
      }

      logger.warn(`Retrying request (${retryCount})`, {
        url: req.url,
        status: error.status,
      });

      const delayTime = getExponentialBackoffDelay(
        retryCount,
        HTTP_RETRY_CONFIG.baseDelayMs,
      );

      return timer(delayTime);
    },
  };
}
