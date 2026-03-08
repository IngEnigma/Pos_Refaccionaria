import { inject, Injectable } from '@angular/core';

import { Environment } from '@env/environment.model';
import { APP_ENV } from '@core/tokens/app-env.token';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly env = inject<Environment>(APP_ENV);

  readonly apiUrl = this.env.apiUrl;
  readonly production = this.env.production;
}
