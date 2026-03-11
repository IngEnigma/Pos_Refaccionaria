import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { API_ENDPOINTS } from '@core/config/api-endpoints';

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
  return request.url.includes(API_ENDPOINTS.AUTH.REFRESH);
}
