import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RegisterMovementPayload } from '../../domain/entities/inventory-movement.entity';
import { InventoryMovementRepository } from '../../domain/repository/movement-repository';

@Injectable({ providedIn: 'root' })
export class RegisterMovementUseCase {
  private readonly repository = inject(InventoryMovementRepository);

  execute(payload: RegisterMovementPayload): Observable<unknown> {
    return this.repository.registerEntryExit(payload);
  }
}
