import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BranchRepository } from '@features/branches/domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class DeleteBranchUseCase {
  private readonly repository = inject(BranchRepository);

  execute(id: number): Observable<void> {
    return this.repository.delete(id);
  }
}
