import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { APP_ENV } from '@core/tokens/app-env.token';

/**
 * Opt-out del trailing slash para endpoints que el backend define SIN slash final.
 * Hoy son solo 4 (ver `usuario/urls.py` en RefaccionariaBack): `users`, `users/<id>`,
 * `login` y `token/refresh`. Todo lo demás usa slash final y lo necesita.
 * Sin este bypass, `POST /api/login/` responde 404 en Django (el patrón es `login`).
 * Deuda: pedir al backend estandarizar (todo con slash) y retirar este bypass.
 */
export const SKIP_TRAILING_SLASH = new HttpContextToken<boolean>(() => false);

/** Contexto listo para usar en repositorios con rutas sin slash final. */
export function withoutTrailingSlash(): HttpContext {
  return new HttpContext().set(SKIP_TRAILING_SLASH, true);
}

export const trailingSlashInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENV);
  const isApiRequest = req.url.startsWith(env.apiUrl);

  if (!isApiRequest || req.context.get(SKIP_TRAILING_SLASH)) {
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
