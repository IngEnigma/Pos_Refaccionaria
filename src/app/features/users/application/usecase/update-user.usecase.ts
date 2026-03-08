import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import {
  UpdateUserPayload,
  UserRepository,
} from '@features/users/domain/repository/user-repository';

@Injectable({ providedIn: 'root' })
export class UpdateUserUseCase {
  private readonly repository = inject(UserRepository);

  execute(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.repository.updateUser(id, payload);
  }
}
