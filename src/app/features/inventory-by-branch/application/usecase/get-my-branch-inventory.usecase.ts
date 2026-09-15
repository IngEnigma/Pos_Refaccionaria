import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BranchInventory } from '../../domain/entities/inventory.entity';
import { InventoryRepository } from '../../domain/repository/inventory-repository';

@Injectable({ providedIn: 'root' })
export class GetMyBranchInventoryUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(): Observable<BranchInventory[]> {
    return this.repository.getMyBranchInventory();
  }
}
