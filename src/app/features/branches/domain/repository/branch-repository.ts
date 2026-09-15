import { Observable } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';

export interface CreateBranchPayload {
  nombreSucursal: string;
  ubicacion: string;
  codigoPostal: string;
  numeroTelefono: string;
  correoElectronico: string;
}

export interface UpdateBranchPayload {
  nombreSucursal?: string;
  ubicacion?: string;
  codigoPostal?: string;
  numeroTelefono?: string;
  correoElectronico?: string;
}

export abstract class BranchRepository {
  abstract getBranches(): Observable<Branch[]>;
  abstract getById(id: number): Observable<Branch>;
  abstract create(payload: CreateBranchPayload): Observable<Branch>;
  abstract update(id: number, payload: UpdateBranchPayload): Observable<Branch>;
  abstract delete(id: number): Observable<void>;
}
