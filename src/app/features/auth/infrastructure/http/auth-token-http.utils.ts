import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { AUTH_ENDPOINTS } from '@features/auth/config/auth-endpoints';

export function withBearerToken<T>(
  request: HttpRequest<T>,
  token: string,
): HttpRequest<T> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function isUnauthorizedError(
  error: unknown,
): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && error.status === 401;
}

export function isRefreshRequest(request: HttpRequest<unknown>): boolean {
  return request.url.includes(AUTH_ENDPOINTS.REFRESH);
}
