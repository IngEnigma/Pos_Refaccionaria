import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class GetBranchesUseCase {
  private readonly repository = inject(BranchRepository);

  execute(): Observable<Branch[]> {
    return this.repository.getBranches();
  }
}
