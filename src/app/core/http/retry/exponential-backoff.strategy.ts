import { inject, Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { canRetryRequest, getExponentialBackoffDelay } from './retry.utils';
import { RETRY_CONFIG } from './retry-config.token';
import { RetryStrategy } from './retry-strategy.interface';

@Injectable({ providedIn: 'root' })
export class ExponentialBackoffStrategy implements RetryStrategy {
  private readonly config = inject(RETRY_CONFIG);

  canRetry(req: HttpRequest<unknown>, error: unknown, retryCount: number): boolean {
    return canRetryRequest(req.method, error, this.config.retryableMethods);
  }

  getDelay(error: unknown, retryCount: number): Observable<number> {
    const baseDelay = getExponentialBackoffDelay(retryCount, this.config.baseDelayMs);
    
    const jitterFactor = 0.2;
    const jitter = (Math.random() * 2 - 1) * baseDelay * jitterFactor;
    const finalDelay = Math.max(0, baseDelay + jitter);

    return timer(finalDelay);
  }
}
