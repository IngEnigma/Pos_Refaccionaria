import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthTokenRefreshOrchestrator } from './auth-token-refresh-orchestrator.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { RefreshTokenUseCase } from '@features/auth/application/usecase/refresh.usecase';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';

describe('AuthTokenRefreshOrchestrator', () => {
  let service: AuthTokenRefreshOrchestrator;
  let sessionServiceMock: any;
  let refreshTokenUseCaseMock: any;
  let loggerMock: any;

  beforeEach(() => {
    sessionServiceMock = {
      getSession: jest.fn(),
      clearSession: jest.fn(),
    };

    refreshTokenUseCaseMock = {
      execute: jest.fn(),
    };

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthTokenRefreshOrchestrator,
        { provide: SessionStateService, useValue: sessionServiceMock },
        { provide: RefreshTokenUseCase, useValue: refreshTokenUseCaseMock },
        { provide: LOGGER_PORT, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(AuthTokenRefreshOrchestrator);
  });

  describe('attachAccessToken', () => {
    it('should NOT attach token if no session exists', () => {
      sessionServiceMock.getSession.mockReturnValue(null);
      const req = new HttpRequest('GET', '/api/data');
      
      const attached = service.attachAccessToken(req);
      
      expect(attached.headers.has('Authorization')).toBe(false);
    });

    it('should attach access token if session exists', () => {
      sessionServiceMock.getSession.mockReturnValue({ accessToken: 'valid-token' });
      const req = new HttpRequest('GET', '/api/data');
      
      const attached = service.attachAccessToken(req);
      
      expect(attached.headers.get('Authorization')).toBe('Bearer valid-token');
    });
  });

  describe('retryRequestAfterRefresh', () => {
    let nextMock: HttpHandlerFn;

    beforeEach(() => {
      nextMock = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    });

    it('should clear session and throw error if no refresh token available', (done) => {
      sessionServiceMock.getSession.mockReturnValue({ refreshToken: null });
      const req = new HttpRequest('GET', '/api/data');

      service.retryRequestAfterRefresh(req, nextMock).subscribe({
        error: (err) => {
          expect(err.message).toBe('No refresh token available');
          expect(sessionServiceMock.clearSession).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should call refresh use case and retry request with new token', fakeAsync(() => {
      sessionServiceMock.getSession.mockReturnValue({ refreshToken: 'valid-refresh' });
      refreshTokenUseCaseMock.execute.mockReturnValue(of({ accessToken: 'new-token' }).pipe(delay(100)));
      
      const req = new HttpRequest('GET', '/api/data');
      let responseReceived = false;

      service.retryRequestAfterRefresh(req, nextMock).subscribe(() => {
        responseReceived = true;
      });

      tick(50);
      expect(responseReceived).toBe(false);

      tick(50);
      expect(responseReceived).toBe(true);
      expect(refreshTokenUseCaseMock.execute).toHaveBeenCalled();
      
      // Check that next was called with the NEW token
      const lastCallReq = (nextMock as jest.Mock).mock.calls[0][0];
      expect(lastCallReq.headers.get('Authorization')).toBe('Bearer new-token');
    }));

    it('should handle simultaneous refreshes using shareReplay (ensure only one execute call)', fakeAsync(() => {
      sessionServiceMock.getSession.mockReturnValue({ refreshToken: 'valid-refresh' });
      refreshTokenUseCaseMock.execute.mockReturnValue(of({ accessToken: 'new-token' }).pipe(delay(100)));
      
      const req1 = new HttpRequest('GET', '/api/data-1');
      const req2 = new HttpRequest('GET', '/api/data-2');

      service.retryRequestAfterRefresh(req1, nextMock).subscribe();
      service.retryRequestAfterRefresh(req2, nextMock).subscribe();

      tick(100);

      // Verify execute was only called ONCE despite two simultaneous requests
      expect(refreshTokenUseCaseMock.execute).toHaveBeenCalledTimes(1);
      expect(nextMock).toHaveBeenCalledTimes(2);
    }));

    it('should handle refresh failure and clear state for next attempt', fakeAsync(() => {
      sessionServiceMock.getSession.mockReturnValue({ refreshToken: 'valid-refresh' });
      refreshTokenUseCaseMock.execute.mockReturnValue(throwError(() => new Error('Refresh Failed')).pipe(delay(100)));
      
      const req = new HttpRequest('GET', '/api/data');

      let errorCaught = false;
      service.retryRequestAfterRefresh(req, nextMock).subscribe({
        error: () => errorCaught = true
      });

      tick(100);
      expect(errorCaught).toBe(true);
      expect(loggerMock.error).toHaveBeenCalledWith('Failed to refresh access token', expect.any(Error));

      // Ensure that after failure, a NEW attempt can be made (refreshInFlight$ is null)
      refreshTokenUseCaseMock.execute.mockReturnValue(of({ accessToken: 'new-token-success' }));
      service.retryRequestAfterRefresh(req, nextMock).subscribe();
      expect(refreshTokenUseCaseMock.execute).toHaveBeenCalledTimes(2);
    }));
  });
});
