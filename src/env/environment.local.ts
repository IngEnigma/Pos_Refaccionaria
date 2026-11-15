import { LogLevel } from '@app/core/logging/log-level.enum';
import { Environment } from '@env/environment.model';

/** Backend Django local (`manage.py runserver 127.0.0.1:8000`) para `npm run e2e:local`. */
export const environment: Environment = {
  production: false,
  loggingLevel: LogLevel.DEBUG,
  apiUrl: 'http://127.0.0.1:8000/api',
};
