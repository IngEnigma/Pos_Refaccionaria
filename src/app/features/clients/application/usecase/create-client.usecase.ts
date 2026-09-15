import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Client } from '@features/clients/domain/entities/client.entity';
import {
  ClientRepository,
  CreateClientPayload,
} from '@features/clients/domain/repository/client-repository';

@Injectable({ providedIn: 'root' })
export class CreateClientUseCase {
  private readonly repository = inject(ClientRepository);

  execute(payload: CreateClientPayload): Observable<Client> {
    return this.repository.createClient(payload);
  }
}
