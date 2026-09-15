import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InventoryMovement, RegisterMovementPayload } from '../../domain/entities/inventory-movement.entity';
import { InventoryMovementRepository } from '../../domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class GetMovementsUseCase {
  private readonly repository = inject(InventoryMovementRepository);

  execute(): Observable<InventoryMovement[]> {
    return this.repository.getMovements();
  }
}
