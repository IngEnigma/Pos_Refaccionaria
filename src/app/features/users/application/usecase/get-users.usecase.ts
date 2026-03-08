import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import { UserRepository } from '@features/users/domain/repository/user-repository';

@Injectable({ providedIn: 'root' })
export class GetUsersUseCase {
  private readonly repository = inject(UserRepository);

  execute(): Observable<User[]> {
    return this.repository.getUsers();
  }
}
