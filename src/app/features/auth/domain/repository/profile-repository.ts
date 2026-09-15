import { Observable } from 'rxjs';

import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';

export abstract class ProfileRepository {
  abstract getMyProfile(): Observable<UserProfile>;
  abstract updateMySucursal(idSucursal: number | null): Observable<UserProfile>;
}
