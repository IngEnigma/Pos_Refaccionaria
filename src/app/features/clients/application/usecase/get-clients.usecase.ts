import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Client } from '@features/clients/domain/entities/client.entity';
import { ClientRepository } from '@features/clients/domain/repository/client-repository';

@Injectable({ providedIn: 'root' })
export class GetClientsUseCase {
  private readonly repository = inject(ClientRepository);

  execute(): Observable<Client[]> {
    return this.repository.getClients();
  }
}
