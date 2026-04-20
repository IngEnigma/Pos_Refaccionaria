import { TestBed } from '@angular/core/testing';
import { UrlSanitizerService } from './url-sanitizer.service';
import { DOCUMENT } from '@angular/common';

describe('UrlSanitizerService', () => {
    let service: UrlSanitizerService;
    const mockDocument = {
        location: {
            origin: 'http://localhost'
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                UrlSanitizerService,
                { provide: DOCUMENT, useValue: mockDocument }
            ]
        });
        service = TestBed.inject(UrlSanitizerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should redact sensitive parameters in the service', () => {
        const url = '/api/v1/data?token=secret&id=1';
        const sanitized = service.sanitizeUrlParams(url);
        
        expect(sanitized).toContain('token=***REDACTED***');
        expect(sanitized).toContain('id=1');
    });

    it('should handle absolute URLs correctly', () => {
        const url = 'http://api.com/test?password=123';
        const sanitized = service.sanitizeUrlParams(url);
        expect(sanitized).toBe('http://api.com/test?password=***REDACTED***');
    });
});
