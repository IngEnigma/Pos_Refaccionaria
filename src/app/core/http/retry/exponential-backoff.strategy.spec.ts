import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { ExponentialBackoffStrategy } from './exponential-backoff.strategy';
import { RETRY_CONFIG } from './retry-config.token';

describe('ExponentialBackoffStrategy', () => {
  let strategy: ExponentialBackoffStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExponentialBackoffStrategy,
        {
          provide: RETRY_CONFIG,
          useValue: { maxRetries: 3, baseDelayMs: 1000, retryableMethods: ['GET', 'HEAD'] },
        },
      ],
    });

    strategy = TestBed.inject(ExponentialBackoffStrategy);
  });

  it('should implement canRetry correctly', () => {
    const error = new HttpErrorResponse({ status: 503 });
    const req = new HttpRequest('GET', '/api/test');
    expect(strategy.canRetry(req, error, 1)).toBe(true);

    const postReq = new HttpRequest('DELETE', '/api/test');
    expect(strategy.canRetry(postReq, error, 1)).toBe(false);

    const badError = new HttpErrorResponse({ status: 400 });
    expect(strategy.canRetry(req, badError, 1)).toBe(false);
  });

  it('should calculate delay with jitter', fakeAsync(() => {
    const error = new HttpErrorResponse({ status: 503 });
        
    let emitted = false;
    strategy.getDelay(error, 1).subscribe(() => emitted = true);
    
    tick(1599); // Minimum is 2000 - 20% = 1600
    expect(emitted).toBe(false);
    
    tick(4000); // 1599 + 4000 is way past maximum possible delay (~4000ms)
    expect(emitted).toBe(true);
  }));
});
