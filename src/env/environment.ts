import { LogLevel } from '@app/core/logging/log-level.enum';
import { Environment } from '@env/environment.model';

export const environment: Environment = {
  production: false,
  loggingLevel: LogLevel.DEBUG,
  apiUrl: 'https://refaccionariaback.onrender.com/api',
};