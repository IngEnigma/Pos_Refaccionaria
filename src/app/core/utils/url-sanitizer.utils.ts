const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'password',
  'secret',
  'api_key',
  'access_token',
  'refresh_token',
  'client_secret'
]);

/**
 * Pure function to sanitize URL parameters by redacting sensitive information.
 * @param urlWithParams The URL to sanitize.
 * @param baseUrl Base URL to use for parsing relative URLs (optional).
 * @returns The sanitized URL.
 */
export function sanitizeUrlParams(urlWithParams: string, baseUrl?: string): string {
  if (!urlWithParams || !urlWithParams.includes('?')) {
    return urlWithParams;
  }

  try {
    const isAbsolute = urlWithParams.startsWith('http');
    // If not absolute and no baseUrl provided, use a dummy one to allow URL parsing
    const effectiveBaseUrl = isAbsolute ? undefined : (baseUrl || 'http://localhost');
    const parsedUrl = new URL(urlWithParams, effectiveBaseUrl);

    parsedUrl.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        SENSITIVE_QUERY_PARAMS.has(lowerKey) || 
        lowerKey.includes('password') || 
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key')
      ) {
        parsedUrl.searchParams.set(key, '***REDACTED***');
      }
    });

    const sanitizedPath = parsedUrl.pathname + parsedUrl.search;
    return isAbsolute ? parsedUrl.origin + sanitizedPath : sanitizedPath;
  } catch {
    return urlWithParams.split('?')[0] + '?sanitized=true';
  }
}
