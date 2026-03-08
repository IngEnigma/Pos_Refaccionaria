import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import { SupplierRepository } from '@features/suppliers/domain/repository/supplier-repository';

@Injectable({ providedIn: 'root' })
export class GetSuppliersUseCase {
  private readonly repository = inject(SupplierRepository);

  execute(): Observable<Supplier[]> {
    return this.repository.getSuppliers();
  }
}
