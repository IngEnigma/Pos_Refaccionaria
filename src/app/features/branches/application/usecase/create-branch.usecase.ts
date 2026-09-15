import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchRepository,
  CreateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';

@Injectable({ providedIn: 'root' })
export class CreateBranchUseCase {
  private readonly repository = inject(BranchRepository);

  execute(payload: CreateBranchPayload): Observable<Branch> {
    return this.repository.create(payload);
  }
}
