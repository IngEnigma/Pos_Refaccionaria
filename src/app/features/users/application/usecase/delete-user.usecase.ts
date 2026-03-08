import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserRepository } from '@features/users/domain/repository/user-repository';

@Injectable({ providedIn: 'root' })
export class DeleteUserUseCase {
  private readonly repository = inject(UserRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteUser(id);
  }
}
