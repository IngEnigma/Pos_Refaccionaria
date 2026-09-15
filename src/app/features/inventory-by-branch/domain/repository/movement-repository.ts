import { Observable } from 'rxjs';
import { InventoryMovement, RegisterMovementPayload } from '../entities/inventory-movement.entity';

export abstract class InventoryMovementRepository {
  abstract getMovements(): Observable<InventoryMovement[]>;
  abstract registerEntryExit(payload: RegisterMovementPayload): Observable<unknown>;
}
