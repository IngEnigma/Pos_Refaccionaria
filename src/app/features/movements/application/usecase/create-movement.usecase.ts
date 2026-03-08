import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Movement } from '@features/movements/domain/entities/movement.entity';
import {
  CreateMovementPayload,
  MovementRepository,
} from '@features/movements/domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class CreateMovementUseCase {
  private readonly repository = inject(MovementRepository);

  execute(payload: CreateMovementPayload): Observable<Movement> {
    return this.repository.createMovement(payload);
  }
}
