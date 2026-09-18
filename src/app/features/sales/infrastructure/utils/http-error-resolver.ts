import { HttpErrorResponse } from '@angular/common/http';

export function resolveHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const backendError = error.error as unknown;

    // Backend Django responde {"error": "Stock insuficiente..."} o {"message": "..."} o {"detail": "..."}
    if (backendError && typeof backendError === 'object') {
      const record = backendError as Record<string, unknown>;
      for (const key of ['error', 'message', 'detail']) {
        if (key in record) {
          const value = record[key];
          if (typeof value === 'string' && value.trim()) return value;
          // Algunos backends mandan {"error": ["Stock insuficiente"]}
          if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0];
        }
      }
      // Caso {"cantidad": ["Stock insuficiente"]} o validación por campo
      const firstStringArray = Object.values(record).find(
        (v) => Array.isArray(v) && typeof (v as unknown[])[0] === 'string',
      ) as string[] | undefined;
      if (firstStringArray?.[0]?.trim()) return firstStringArray[0];
    }

    if (typeof backendError === 'string' && backendError.trim()) return backendError;

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
