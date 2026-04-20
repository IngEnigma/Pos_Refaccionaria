import { HttpErrorResponse } from '@angular/common/http';

export function resolveHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = (error.error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
