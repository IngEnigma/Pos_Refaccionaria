import { HttpErrorResponse } from '@angular/common/http';
import { canRetryRequest, getExponentialBackoffDelay } from './retry.utils';
import { HTTP_RETRY_CONFIG, RETRYABLE_CODES_STATUSES } from '@core/config/http-retry.config';

describe('Retry Utils', () => {
  describe('canRetryRequest', () => {
    it('should return false if error is not HttpErrorResponse', () => {
      const error = new Error('Normal error');
      expect(canRetryRequest('GET', error, HTTP_RETRY_CONFIG.retryableMethods)).toBe(false);
    });

    it('should return false if method is not retryable', () => {
      const error = new HttpErrorResponse({ status: 500 });
      expect(canRetryRequest('POST', error, ['GET'])).toBe(false);
      expect(canRetryRequest('DELETE', error, ['GET'])).toBe(false);
    });

    it('should return false if status is not in RETRYABLE_CODES_STATUSES', () => {
      const retryableMethods = ['GET'];
      const error = new HttpErrorResponse({ status: 400 });
      expect(canRetryRequest('GET', error, retryableMethods)).toBe(false);
    });

    it('should return true if method is retryable and status is retryable', () => {
      const retryableMethods = ['GET', 'POST'] as const;
      RETRYABLE_CODES_STATUSES.forEach(status => {
        const error = new HttpErrorResponse({ status });
        expect(canRetryRequest('GET', error, retryableMethods)).toBe(true);
        expect(canRetryRequest('POST', error, retryableMethods)).toBe(true);
      });
    });

    it('should return true for network errors (status 0) if registered as retryable', () => {
       if (RETRYABLE_CODES_STATUSES.includes(0)) {
         const error = new HttpErrorResponse({ status: 0 });
         expect(canRetryRequest('GET', error, HTTP_RETRY_CONFIG.retryableMethods)).toBe(true);
       }
    });
  });

  describe('getExponentialBackoffDelay', () => {
    const baseDelay = 1000;

    it('should be within [2000, 3000] for attempt 1', () => {
      const delay = getExponentialBackoffDelay(1, baseDelay);
      expect(delay).toBeGreaterThanOrEqual(2000);
      expect(delay).toBeLessThanOrEqual(3000);
    });

    it('should be within [4000, 5000] for attempt 2', () => {
      const delay = getExponentialBackoffDelay(2, baseDelay);
      expect(delay).toBeGreaterThanOrEqual(4000);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should be within [8000, 9000] for attempt 3', () => {
      const delay = getExponentialBackoffDelay(3, baseDelay);
      expect(delay).toBeGreaterThanOrEqual(8000);
      expect(delay).toBeLessThanOrEqual(9000);
    });

    it('should be within [1000, 2000] for attempt 0', () => {
      const delay = getExponentialBackoffDelay(0, baseDelay);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(2000);
    });

    it('should return different values on consecutive calls (randomness check)', () => {
      const delay1 = getExponentialBackoffDelay(1, baseDelay);
      const delay2 = getExponentialBackoffDelay(1, baseDelay);
      expect(delay1).not.toBe(delay2);
    });
  });
});
