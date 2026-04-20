import { HttpContextToken } from '@angular/common/http';

export const RETRY_COUNT = new HttpContextToken<number | undefined>(() => undefined);
