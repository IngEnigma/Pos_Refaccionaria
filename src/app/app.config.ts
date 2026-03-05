import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authTokenInterceptor } from '@core/interceptors/auth-token.interceptor';
import { httpErrorInterceptor } from '@app/core/interceptors/http-error.interceptor';
import { STORAGE_PORT } from '@core/ports/storage.port';
import { LocalStorageService } from '@core/services/local-storage.service';
import { APP_ENV } from '@core/tokens/app-env.token';
import { environment } from '@env/environment';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { routes } from '@app/app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor, authTokenInterceptor])),
    {
      provide: APP_ENV,
      useValue: environment,
    },
    {
      provide: STORAGE_PORT,
      useExisting: LocalStorageService,
    },
    {
      provide: AuthRepository,
      useExisting: AuthRepositoryImpl,
    },
  ],
};
