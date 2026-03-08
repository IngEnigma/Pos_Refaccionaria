import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import {
  CreateSupplierPayload,
  SupplierRepository,
} from '@features/suppliers/domain/repository/supplier-repository';

@Injectable({ providedIn: 'root' })
export class CreateSupplierUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(payload: CreateSupplierPayload): Observable<Supplier> {
    return this.repository.createSupplier(payload);
  }
}
