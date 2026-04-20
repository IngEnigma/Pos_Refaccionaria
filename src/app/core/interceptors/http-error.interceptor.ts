import { catchError, retry } from 'rxjs';
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { RetryStrategyService } from '@core/http/retry/retry.strategy';
import { HttpErrorHandlerService } from '@core/http/error/http-error.handler';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const retryStrategy = inject(RetryStrategyService);
  const errorHandler = inject(HttpErrorHandlerService);

  return next(req).pipe(
    retry(retryStrategy.createRetryStrategy(req)),
    catchError(errorHandler.handleFinalError(req)),
  );
};
