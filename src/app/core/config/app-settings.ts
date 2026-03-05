import { Inject, Injectable } from '@angular/core';

import { Environment } from '@env/environment.model';
import { APP_ENV } from '@core/tokens/app-env.token';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {

/**
 * Constructor for the AppSettingsService.
 * @param env - The environment settings to use.
 * Logs the environment settings to the console.
 */
  constructor(@Inject(APP_ENV) private env: Environment) {
    console.log('TOKEN ENV:', this.env);
  }

}
