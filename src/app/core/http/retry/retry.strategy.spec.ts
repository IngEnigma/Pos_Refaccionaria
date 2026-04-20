import { TestBed, fakeAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpRequest, HttpContext } from '@angular/common/http';

import { RetryStrategyService } from './retry.strategy';
import { RETRY_CONFIG } from './retry-config.token';
import { RETRY_COUNT } from './retry.context';
import { RETRY_STRATEGY } from './retry-strategy.token';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';

describe('RetryStrategyService', () => {
  let service: RetryStrategyService;
  let loggerMock: jest.Mocked<Partial<LoggerPort>>;
  let strategyMock: any;

  beforeEach(() => {
    loggerMock = {
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    strategyMock = {
      canRetry: jest.fn(),
      getDelay: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RetryStrategyService,
        { provide: RETRY_STRATEGY, useValue: strategyMock },
        { provide: LOGGER_PORT, useValue: loggerMock },
      ],
    });

    TestBed.overrideProvider(RETRY_CONFIG, {
      useValue: { maxRetries: 5, baseDelayMs: 1000 },
    });

    service = TestBed.inject(RetryStrategyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createRetryStrategy', () => {
    let req: HttpRequest<unknown>;

    beforeEach(() => {
      req = new HttpRequest('GET', '/api/test');
    });

    it('should use default maxRetries from config if context is not set', () => {
      const strategy = service.createRetryStrategy(req);
      expect(strategy.count).toBe(5);
    });

    it('should use maxRetries from HttpContext if provided', () => {
      const context = new HttpContext().set(RETRY_COUNT, 10);
      req = new HttpRequest('GET', '/api/test', { context });
      const strategy = service.createRetryStrategy(req);
      expect(strategy.count).toBe(10);
    });

    it('should not retry if strategy.canRetry returns false', (done) => {
      strategyMock.canRetry.mockReturnValue(false);
      const strategy = service.createRetryStrategy(req);
      const error = { status: 400 };

      strategy.delay(error, 1).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(loggerMock.warn).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should not retry if retryCount exceeds maxRetries', (done) => {
      strategyMock.canRetry.mockReturnValue(true);
      const strategy = service.createRetryStrategy(req);
      const error = { status: 503 };

      strategy.delay(error, 6).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should delegate to strategy.getDelay if canRetry is true', fakeAsync(() => {
      strategyMock.canRetry.mockReturnValue(true);
      strategyMock.getDelay.mockReturnValue(of(0));
      
      const strategy = service.createRetryStrategy(req);
      const error = { status: 503 };

      strategy.delay(error, 1).subscribe();

      // Check for the new log format
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retrying request (1/5)'),
        expect.objectContaining({ url: '/api/test' })
      );
      expect(strategyMock.getDelay).toHaveBeenCalledWith(error, 1);
    }));
  });
});
