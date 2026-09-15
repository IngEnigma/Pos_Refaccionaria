import { Observable } from 'rxjs';

import { Client } from '@features/clients/domain/entities/client.entity';

export interface CreateClientPayload {
  idSucursal: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono: string;
  correo?: string | null;
  direccion?: string | null;
  rfc?: string | null;
}

export interface UpdateClientPayload {
  idSucursal?: number;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;
  telefono?: string;
  correo?: string | null;
  direccion?: string | null;
  rfc?: string | null;
}

export abstract class ClientRepository {
  abstract getClients(): Observable<Client[]>;
  abstract createClient(payload: CreateClientPayload): Observable<Client>;
  abstract updateClient(id: number, payload: UpdateClientPayload): Observable<Client>;
  abstract deleteClient(id: number): Observable<void>;
}
