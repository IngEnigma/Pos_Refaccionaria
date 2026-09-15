import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ClientRepository } from '@features/clients/domain/repository/client-repository';

@Injectable({ providedIn: 'root' })
export class DeleteClientUseCase {
  private readonly repository = inject(ClientRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteClient(id);
  }
}
