import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Movement } from '@features/movements/domain/entities/movement.entity';
import {
  MovementRepository,
  UpdateMovementPayload,
} from '@features/movements/domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class UpdateMovementUseCase {
  private readonly repository = inject(MovementRepository);

  execute(id: number, payload: UpdateMovementPayload): Observable<Movement> {
    return this.repository.updateMovement(id, payload);
  }
}
