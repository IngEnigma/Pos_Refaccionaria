import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import {
  SupplierRepository,
  UpdateSupplierPayload,
} from '@features/suppliers/domain/repository/supplier-repository';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(id: number, payload: UpdateSupplierPayload): Observable<Supplier> {
    return this.repository.updateSupplier(id, payload);
  }
}
