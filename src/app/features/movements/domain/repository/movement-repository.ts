import { Observable } from 'rxjs';

import { Movement } from '@features/movements/domain/entities/movement.entity';

export interface CreateMovementPayload {
  tipo: string;
  cantidad: number;
  razon: string;
  observacion: string | null;
}

export interface UpdateMovementPayload {
  tipo?: string;
  cantidad?: number;
  razon?: string;
  observacion?: string | null;
}

export abstract class MovementRepository {
  abstract getMovements(): Observable<Movement[]>;
  abstract createMovement(payload: CreateMovementPayload): Observable<Movement>;
  abstract updateMovement(id: number, payload: UpdateMovementPayload): Observable<Movement>;
  abstract deleteMovement(id: number): Observable<void>;
}
