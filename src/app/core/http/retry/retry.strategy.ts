import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpRequest } from '@angular/common/http';

import { RETRY_CONFIG } from './retry-config.token';
import { RETRY_COUNT } from './retry.context';
import { RETRY_STRATEGY } from './retry-strategy.token';
import { LoggerPort, LOGGER_PORT } from '@core/logging/logger.port';

@Injectable({ providedIn: 'root' })
export class RetryStrategyService {
  private readonly config = inject(RETRY_CONFIG);
  private readonly strategy = inject(RETRY_STRATEGY);
  private readonly logger: LoggerPort = inject(LOGGER_PORT).withContext('RetryStrategyService');

  createRetryStrategy(req: HttpRequest<unknown>) {
    const maxRetries = req.context.get(RETRY_COUNT) ?? this.config.maxRetries;

    return {
      count: maxRetries,
      delay: (error: unknown, retryCount: number): Observable<number> => {
        if (!this.strategy.canRetry(req, error, retryCount) || retryCount > maxRetries) {
          return throwError(() => error);
        }

        this.logger.warn(`Retrying request (${retryCount}/${maxRetries})`, {
          url: req.url,
          strategy: this.strategy.constructor.name,
        });

        return this.strategy.getDelay(error, retryCount);
      },
    };
  }
}
