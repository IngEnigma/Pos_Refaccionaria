import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

import { LoggerPort, LOGGER_PORT } from '@core/logging/logger.port';
import { buildHttpErrorLog } from '@core/http/error/http-error-log.builder';
import { UrlSanitizerService } from '@core/utils/url-sanitizer.service';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { AppRoutes } from '@app/app-routes';

@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {
    private readonly logger: LoggerPort = inject(LOGGER_PORT).withContext('HttpErrorHandlerService');
    private readonly sanitizer = inject(UrlSanitizerService);
    private readonly router = inject(Router);
    private readonly sessionState = inject(SessionStateService);

    handleFinalError(req: HttpRequest<unknown>) {
        return (error: unknown) => {
            const sanitizedUrl = this.sanitizer.sanitizeUrlParams(req.urlWithParams);
            
            if (error instanceof HttpErrorResponse) {
                if (error.status === 401) {
                    this.sessionState.clearSession();
                    this.router.navigate(['/' + AppRoutes.login]);
                } else if (error.status === 403) {
                    this.router.navigate(['/forbidden']);
                }

                if (error.status === 0) {
                    this.logger.warn('Network error intercepted', buildHttpErrorLog(req, error, sanitizedUrl));
                } else {
                    this.logger.error('HTTP error intercepted', buildHttpErrorLog(req, error, sanitizedUrl));
                }
                return throwError(() => error);
            }

            this.logger.error('Unknown error intercepted', {
                method: req.method,
                url: sanitizedUrl,
                error,
            });

            return throwError(() => error);
        };
    }
}
