import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';

@Injectable({ providedIn: 'root' })
export class UpdateMySucursalUseCase {
  private readonly repository = inject(ProfileRepository);

  execute(idSucursal: number | null): Observable<UserProfile> {
    return this.repository.updateMySucursal(idSucursal);
  }
}
