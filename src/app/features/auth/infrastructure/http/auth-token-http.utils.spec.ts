import { HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';

import {
  isRefreshRequest,
  isUnauthorizedError,
  withBearerToken,
} from './auth-token-http.utils';

describe('auth-token-http.utils', () => {
  describe('withBearerToken', () => {
    it('agrega el encabezado Authorization con el token', () => {
      const request = new HttpRequest('GET', '/api/data');

      const result = withBearerToken(request, 'abc');

      expect(result.headers.get('Authorization')).toBe('Bearer abc');
    });

    it('no muta la petición original', () => {
      const request = new HttpRequest('GET', '/api/data');

      withBearerToken(request, 'abc');

      expect(request.headers.has('Authorization')).toBe(false);
    });

    it('reemplaza un Authorization previo y conserva los otros encabezados', () => {
      const request = new HttpRequest('GET', '/api/data', {
        headers: new HttpHeaders({ Authorization: 'Bearer viejo', 'X-Trace': '1' }),
      });

      const result = withBearerToken(request, 'nuevo');

      expect(result.headers.get('Authorization')).toBe('Bearer nuevo');
      expect(result.headers.get('X-Trace')).toBe('1');
    });
  });

  describe('isUnauthorizedError', () => {
    it('true para HttpErrorResponse 401', () => {
      expect(isUnauthorizedError(new HttpErrorResponse({ status: 401 }))).toBe(true);
    });

    it.each([400, 403, 500, 0])('false para HttpErrorResponse %i', (status) => {
      expect(isUnauthorizedError(new HttpErrorResponse({ status }))).toBe(false);
    });

    it.each([new Error('401'), { status: 401 }, null, undefined, '401'])(
      'false para valores que no son HttpErrorResponse (%p)',
      (value) => {
        expect(isUnauthorizedError(value)).toBe(false);
      },
    );
  });

  describe('isRefreshRequest', () => {
    it('true para el endpoint de refresh', () => {
      const request = new HttpRequest('POST', 'http://api.test/token/refresh', {});

      expect(isRefreshRequest(request)).toBe(true);
    });

    it('false para otros endpoints', () => {
      const request = new HttpRequest('GET', 'http://api.test/productos');

      expect(isRefreshRequest(request)).toBe(false);
    });
  });
});
