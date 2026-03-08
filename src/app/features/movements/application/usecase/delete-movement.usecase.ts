import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MovementRepository } from '@features/movements/domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class DeleteMovementUseCase {
  private readonly repository = inject(MovementRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteMovement(id);
  }
}
