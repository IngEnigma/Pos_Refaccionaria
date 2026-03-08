import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SupplierRepository } from '@features/suppliers/domain/repository/supplier-repository';

@Injectable({ providedIn: 'root' })
export class DeleteSupplierUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(id: number): Observable<void> {
    return this.repository.deleteSupplier(id);
  }
}
