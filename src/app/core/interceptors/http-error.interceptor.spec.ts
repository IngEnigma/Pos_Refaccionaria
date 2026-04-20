import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor } from './http-error.interceptor';
import { RetryStrategyService } from '@core/http/retry/retry.strategy';
import { HttpErrorHandlerService } from '@core/http/error/http-error.handler';
import { throwError, timer, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { UrlSanitizerService } from '@core/utils/url-sanitizer.service';

describe('httpErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let retryStrategyMock: jest.Mocked<Partial<RetryStrategyService>>;
  let routerMock: jest.Mocked<Partial<Router>>;
  let sessionStateMock: jest.Mocked<Partial<SessionStateService>>;
  let loggerMock = { withContext: jest.fn().mockReturnValue({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }) };

  beforeEach(() => {
    retryStrategyMock = {
      createRetryStrategy: jest.fn().mockImplementation(() => ({
        count: 1,
        delay: (err: HttpErrorResponse): Observable<unknown> => throwError(() => err),
      }))
    };

    routerMock = {
      navigate: jest.fn()
    };

    sessionStateMock = {
      clearSession: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: RetryStrategyService, useValue: retryStrategyMock },
        { provide: Router, useValue: routerMock },
        { provide: SessionStateService, useValue: sessionStateMock },
        { provide: LOGGER_PORT, useValue: loggerMock },
        { provide: UrlSanitizerService, useValue: { sanitizeUrlParams: jest.fn().mockImplementation((url) => url) } },
        HttpErrorHandlerService
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass request to next and handle response securely', () => {
    httpClient.get('/api/test').subscribe((res) => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/test');
    expect(retryStrategyMock.createRetryStrategy).toHaveBeenCalled();
    req.flush({ success: true });
  });

  it('should apply retry strategy before catching errors', fakeAsync(() => {
    let attempt = 0;
    const createRetryStrategyMock = retryStrategyMock.createRetryStrategy as jest.Mock;
    createRetryStrategyMock.mockImplementation(() => ({
      count: 1,
      delay: (err: HttpErrorResponse): Observable<unknown> => {
        attempt++;
        if (attempt === 1) return timer(1);
        return throwError(() => err);
      }
    }));

    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      }
    });

    const req1 = httpMock.expectOne('/api/test');
    req1.flush('Error', { status: 500, statusText: 'Server Error' });

    tick(1);

    const req2 = httpMock.expectOne('/api/test');
    req2.flush('Error', { status: 500, statusText: 'Server Error' });
  }));

  it('should navigate to login and clear session when receiving a 401 error', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(sessionStateMock.clearSession).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
