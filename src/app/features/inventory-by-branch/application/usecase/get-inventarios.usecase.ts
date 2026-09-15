import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InventarioRef } from '../../domain/entities/inventory-movement.entity';
import { InventoryRepository } from '../../domain/repository/inventory-repository';

@Injectable({ providedIn: 'root' })
export class GetInventariosUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(): Observable<InventarioRef[]> {
    return this.repository.getInventarios();
  }
}
