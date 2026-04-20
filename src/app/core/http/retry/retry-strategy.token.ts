import { inject, InjectionToken } from '@angular/core';
import { RetryStrategy } from './retry-strategy.interface';
import { ExponentialBackoffStrategy } from './exponential-backoff.strategy';

export const RETRY_STRATEGY = new InjectionToken<RetryStrategy>('RETRY_STRATEGY', {
  providedIn: 'root',
  factory: () => inject(ExponentialBackoffStrategy)
});
