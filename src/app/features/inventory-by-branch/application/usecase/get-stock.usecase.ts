import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InventoryRepository } from '../../domain/repository/inventory-repository';

@Injectable({ providedIn: 'root' })
export class GetStockUseCase {
  private readonly repository = inject(InventoryRepository);

  execute(sucursalId: number): Observable<ReadonlyMap<number, number>> {
    return this.repository.getStock(sucursalId);
  }
}
