import { Observable } from 'rxjs';

import { Session } from '@features/auth/domain/entities/auth-session.entity';

export interface LoginCredentials {
  username: string;
  password: string;
}

export abstract class AuthRepository {
  abstract login(payload: LoginCredentials): Observable<Session>;
  abstract refresh(refreshToken: string): Observable<string>;
}
