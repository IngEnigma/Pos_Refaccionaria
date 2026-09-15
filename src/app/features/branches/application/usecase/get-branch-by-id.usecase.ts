import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class GetBranchByIdUseCase {
  private readonly repository = inject(BranchRepository);

  execute(id: number): Observable<Branch> {
    return this.repository.getById(id);
  }
}
