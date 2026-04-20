import { TestBed } from '@angular/core/testing';
import { HttpErrorHandlerService } from './http-error.handler';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { UrlSanitizerService } from '@core/utils/url-sanitizer.service';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { Router } from '@angular/router';
import { SessionStateService } from '@features/auth/application/services/session-state.service';

describe('HttpErrorHandlerService', () => {
    let service: HttpErrorHandlerService;
    let loggerMock: jest.Mocked<LoggerPort>;
    let sanitizerMock: jest.Mocked<Partial<UrlSanitizerService>>;

    beforeEach(() => {
        loggerMock = {
            warn: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
            fatal: jest.fn(),
            withContext: jest.fn().mockReturnThis(),
        };

        sanitizerMock = {
            sanitizeUrlParams: jest.fn((url: string) => url),
        };

        TestBed.configureTestingModule({
            providers: [
                HttpErrorHandlerService,
                { provide: LOGGER_PORT, useValue: loggerMock },
                { provide: UrlSanitizerService, useValue: sanitizerMock },
                { provide: Router, useValue: { navigate: jest.fn() } },
                { provide: SessionStateService, useValue: { clearSession: jest.fn() } },
            ]
        });

        service = TestBed.inject(HttpErrorHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleFinalError', () => {
        let req: HttpRequest<unknown>;

        beforeEach(() => {
            req = new HttpRequest('GET', '/api/test?secret=123');
        });

        it('should log warning for network error (status 0)', async () => {
            const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
            
            await expect(firstValueFrom(service.handleFinalError(req)(error))).rejects.toBe(error);

            expect(sanitizerMock.sanitizeUrlParams).toHaveBeenCalledWith(req.urlWithParams);
            expect(loggerMock.warn).toHaveBeenCalledWith('Network error intercepted', expect.any(Object));
        });

        it('should log error for HTTP error (> 0)', async () => {
            const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
            
            await expect(firstValueFrom(service.handleFinalError(req)(error))).rejects.toBe(error);

            expect(loggerMock.error).toHaveBeenCalledWith('HTTP error intercepted', expect.any(Object));
        });

        it('should log error for non-HTTP error', async () => {
            const error = new Error('Custom Error');
            
            await expect(firstValueFrom(service.handleFinalError(req)(error))).rejects.toBe(error);

            expect(loggerMock.error).toHaveBeenCalledWith('Unknown error intercepted', expect.objectContaining({
                method: 'GET',
                url: '/api/test?secret=123',
                error
            }));
        });
    });
});
