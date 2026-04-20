import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authTokenInterceptor } from './auth-token.interceptor';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { AuthTokenRefreshOrchestrator } from '@features/auth/application/services/auth-token-refresh-orchestrator.service';
import { throwError } from 'rxjs';

jest.mock('./auth-token-http.utils', () => ({
  isRefreshRequest: jest.fn(),
  isUnauthorizedError: jest.fn(),
}));

import * as authUtils from './auth-token-http.utils';

describe('authTokenInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let loggerMock: any;
  let orchestratorMock: any;

  beforeEach(() => {
    loggerMock = {
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    orchestratorMock = {
      attachAccessToken: jest.fn((req) => req.clone({ setHeaders: { Authorization: 'Bearer test' } })),
      retryRequestAfterRefresh: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        { provide: LOGGER_PORT, useValue: loggerMock },
        { provide: AuthTokenRefreshOrchestrator, useValue: orchestratorMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should attach access token to request', () => {
    httpClient.get('/api/data').subscribe();
    
    const req = httpMock.expectOne('/api/data');
    expect(orchestratorMock.attachAccessToken).toHaveBeenCalled();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test');
    req.flush({});
  });

  it('should pass through non-401 errors', () => {
    (authUtils.isUnauthorizedError as unknown as jest.Mock).mockReturnValue(false);

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });

  it('should abort refresh flow if 401 is from a refresh request', () => {
    (authUtils.isUnauthorizedError as unknown as jest.Mock).mockReturnValue(true);
    (authUtils.isRefreshRequest as unknown as jest.Mock).mockReturnValue(true);

    httpClient.get('/api/refresh').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/refresh');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(loggerMock.warn).toHaveBeenCalledWith('Refresh endpoint returned 401, aborting refresh flow');
    expect(orchestratorMock.retryRequestAfterRefresh).not.toHaveBeenCalled();
  });

  it('should attempt refresh flow and retry request on 401 for normal requests', () => {
    (authUtils.isUnauthorizedError as unknown as jest.Mock).mockReturnValue(true);
    (authUtils.isRefreshRequest as unknown as jest.Mock).mockReturnValue(false);

    // Mock the retry to just complete
    orchestratorMock.retryRequestAfterRefresh.mockReturnValue(throwError(() => new Error('Retried Error')));

    httpClient.get('/api/data').subscribe({
      error: (err) => {
        expect(err.message).toBe('Retried Error');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(loggerMock.warn).toHaveBeenCalledWith('401 Unauthorized error intercepted, attempting token refresh');
    expect(orchestratorMock.retryRequestAfterRefresh).toHaveBeenCalled();
  });
});
