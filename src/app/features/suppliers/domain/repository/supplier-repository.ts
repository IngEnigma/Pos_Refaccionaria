import { Observable } from 'rxjs';

import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';

export interface CreateSupplierPayload {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export interface UpdateSupplierPayload {
  nombre?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export abstract class SupplierRepository {
  abstract getSuppliers(): Observable<Supplier[]>;
  abstract createSupplier(payload: CreateSupplierPayload): Observable<Supplier>;
  abstract updateSupplier(id: number, payload: UpdateSupplierPayload): Observable<Supplier>;
  abstract deleteSupplier(id: number): Observable<void>;
}
