import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { APP_ENV } from '@core/tokens/app-env.token';

export const trailingSlashInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);
  const isApiRequest = req.url.startsWith(env.apiUrl);

  if (!isApiRequest) {
    return next(req);
  }

  const [url, queryParams] = req.url.split('?');

  if (url.endsWith('/')) {
    return next(req);
  }

  const newUrl = queryParams ? `${url}/?${queryParams}` : `${url}/`;

  const modifiedReq = req.clone({
    url: newUrl,
  });

  return next(modifiedReq);
};
