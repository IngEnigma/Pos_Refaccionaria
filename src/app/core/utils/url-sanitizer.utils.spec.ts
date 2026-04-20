import { sanitizeUrlParams } from './url-sanitizer.utils';

describe('UrlSanitizer Utility', () => {
    it('should return the same URL if it has no query parameters', () => {
        const url = '/api/users';
        expect(sanitizeUrlParams(url)).toBe(url);
    });

    it('should redact sensitive parameters like token and password', () => {
        const url = '/api/login?token=abc-123&password=secret-pass&user=admin';
        const sanitized = sanitizeUrlParams(url);
        
        expect(sanitized).toContain('token=***REDACTED***');
        expect(sanitized).toContain('password=***REDACTED***');
        expect(sanitized).toContain('user=admin');
    });

    it('should be case-insensitive for sensitive parameters', () => {
        const url = '/api/login?TOKEN=abc&PassWord=secret';
        const sanitized = sanitizeUrlParams(url);
        
        expect(sanitized).toContain('TOKEN=***REDACTED***');
        expect(sanitized).toContain('PassWord=***REDACTED***');
    });

    it('should redact parameters containing sensitive keywords', () => {
        const url = '/api/test?my_api_key=123&client_secret_id=456&someToken=789';
        const sanitized = sanitizeUrlParams(url);
        
        expect(sanitized).toContain('my_api_key=***REDACTED***');
        expect(sanitized).toContain('client_secret_id=***REDACTED***');
        expect(sanitized).toContain('someToken=***REDACTED***');
    });

    it('should handle absolute URLs correctly', () => {
        const url = 'https://api.example.com/v1/auth?token=xyz';
        const sanitized = sanitizeUrlParams(url);
        
        expect(sanitized).toBe('https://api.example.com/v1/auth?token=***REDACTED***');
    });

    it('should handle relative URLs and retain original structure', () => {
        const url = 'some-path?token=123';
        const sanitized = sanitizeUrlParams(url);
        // If no baseUrl is provided, it uses http://localhost, and returns the path
        expect(sanitized).toBe('/some-path?token=***REDACTED***');
    });

    it('should handle malformed URLs gracefully by using the fallback', () => {
        // Very weird URL that might fail parsing if base is not provided
        const url = 'http://:8080?token=123';
        const sanitized = sanitizeUrlParams(url);
        expect(sanitized).toBe('http://:8080?sanitized=true');
    });
});
