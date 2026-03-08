import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import {
  CreateUserPayload,
  UserRepository,
} from '@features/users/domain/repository/user-repository';

@Injectable({ providedIn: 'root' })
export class CreateUserUseCase {
  private readonly repository = inject(UserRepository);

  execute(payload: CreateUserPayload): Observable<User> {
    return this.repository.createUser(payload);
  }
}
