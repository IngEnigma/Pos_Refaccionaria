import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchRepository,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class UpdateBranchUseCase {
  private readonly repository = inject(BranchRepository);

  execute(id: number, payload: UpdateBranchPayload): Observable<Branch> {
    return this.repository.update(id, payload);
  }
}
