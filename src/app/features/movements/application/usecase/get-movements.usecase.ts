import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Movement } from '@features/movements/domain/entities/movement.entity';
import { MovementRepository } from '@features/movements/domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class GetMovementsUseCase {
  private readonly repository = inject(MovementRepository);

  execute(): Observable<Movement[]> {
    return this.repository.getMovements();
  }
}
