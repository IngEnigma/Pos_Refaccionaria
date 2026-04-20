import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { SaleHistory } from '../../domain/entities/sale-history.entity';

@Injectable({ providedIn: 'root' })
export class GetSalesHistoryUseCase {
  private readonly saleRepository = inject(SaleRepository);
  private readonly userRepository = inject(UserRepository);

  execute(): Observable<SaleHistory[]> {
    return forkJoin({
      sales: this.saleRepository.getSales(),
      users: this.userRepository.getUsers(),
    }).pipe(
      map(({ sales, users }) => {
        const usersMap = new Map(users.map((u) => [u.id, u.username]));

        return sales.map((sale) => ({
          ...sale,
          usuarioNombre: usersMap.get(sale.idUsuario ?? -1) ?? 'Usuario Desconocido',
        })) as SaleHistory[];
      })
    );
  }
}
