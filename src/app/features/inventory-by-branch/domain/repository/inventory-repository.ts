import { Observable } from 'rxjs';
import { BranchInventory } from '../entities/inventory.entity';
import { InventarioRef } from '../entities/inventory-movement.entity';

export abstract class InventoryRepository {
  abstract getMyBranchInventory(): Observable<BranchInventory[]>;
  abstract getInventarios(): Observable<InventarioRef[]>;
  abstract createInventario(payload: { idSucursal: number; descripcion: string }): Observable<InventarioRef>;
}
