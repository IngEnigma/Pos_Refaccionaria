import { InjectionToken } from '@angular/core';

import { Environment } from '@env/environment.model';

export const APP_ENV = new InjectionToken<Environment>('app.env');