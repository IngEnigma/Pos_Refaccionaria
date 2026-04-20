import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { buildHttpErrorLog, normalizePayload } from './http-error-log.builder';

describe('HttpErrorLogBuilder', () => {
    describe('normalizePayload', () => {
        it('should return the same payload if it is a simple object', () => {
            const payload = { error: 'test' };
            expect(normalizePayload(payload)).toBe(payload);
        });

        it('should extract name and message if payload is an Error object', () => {
            const error = new Error('Original error');
            error.name = 'CustomError';
            
            const normalized = normalizePayload(error);
            expect(normalized).toEqual({
                name: 'CustomError',
                message: 'Original error'
            });
        });

        it('should extract type if payload is a ProgressEvent', () => {
            const event = new ProgressEvent('error');
            const normalized = normalizePayload(event);
            expect(normalized).toEqual({
                type: 'error'
            });
        });

        it('should return null/undefined correctly', () => {
            expect(normalizePayload(null)).toBeNull();
            expect(normalizePayload(undefined)).toBeUndefined();
        });
    });

    describe('buildHttpErrorLog', () => {
        it('should build a complete log object', () => {
            const req = new HttpRequest('GET', '/api/test');
            const error = new HttpErrorResponse({
                status: 500,
                statusText: 'Internal Server Error',
                error: { code: 'ERR_123' },
            });
            const sanitizedUrl = '/api/test';

            const log = buildHttpErrorLog(req, error, sanitizedUrl);

            expect(log).toEqual({
                method: 'GET',
                url: '/api/test',
                status: 500,
                statusText: 'Internal Server Error',
                message: expect.stringContaining('500 Internal Server Error'),
                payload: { code: 'ERR_123' },
            });
        });
    });
});
