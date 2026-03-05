import { catchError, retry } from 'rxjs';
import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
} from '@angular/common/http';

import { createRetryStrategy } from '@core/http/retry/retry.strategy';
import { LoggerService } from '@core/logging/logger.service';
import { handleFinalError } from '../http/error/http-error.handler';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService).withContext('HttpErrorInterceptor');

  return next(req).pipe(
    retry(createRetryStrategy(req, logger)),
    catchError(handleFinalError(req, logger)),
  );
};
