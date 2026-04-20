import { InjectionToken } from '@angular/core';
import { HTTP_RETRY_CONFIG } from '@core/config/http-retry.config';
import { RetryConfig } from './retry-config.interface';

export const RETRY_CONFIG = new InjectionToken<RetryConfig>('RETRY_CONFIG', {
  factory: () => HTTP_RETRY_CONFIG,
  providedIn: 'root'
});
