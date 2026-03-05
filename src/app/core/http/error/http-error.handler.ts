import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { LoggerPort } from '@core/logging/logger.port';
import { buildHttpErrorLog } from './http-error-log.builder';

export function handleFinalError(
    req: HttpRequest<unknown>,
    logger: LoggerPort,
) {
    return (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
                logger.warn('Network error intercepted', buildHttpErrorLog(req, error));
            } else {
                logger.error('HTTP error intercepted', buildHttpErrorLog(req, error));
            }

            return throwError(() => error);
        }

        logger.error('Unknown error intercepted', {
            method: req.method,
            url: req.urlWithParams,
            error,
        });

        return throwError(() => error);
    };
}
