import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Client } from '@features/clients/domain/entities/client.entity';
import {
  ClientRepository,
  UpdateClientPayload,
} from '@features/clients/domain/repository/client-repository';

@Injectable({ providedIn: 'root' })
export class UpdateClientUseCase {
  private readonly repository = inject(ClientRepository);

  execute(id: number, payload: UpdateClientPayload): Observable<Client> {
    return this.repository.updateClient(id, payload);
  }
}
