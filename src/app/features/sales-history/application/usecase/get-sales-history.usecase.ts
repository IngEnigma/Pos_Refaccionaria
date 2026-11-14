import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { PaginatedResponse } from '@core/models/pagination.model';
import { SaleRepository, SalesListFilters, SalesPageParams } from '@features/sales/domain/repository/sale-repository';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { SaleHistory } from '../../domain/entities/sale-history.entity';

export interface SalesHistoryPageParams extends SalesPageParams {}

@Injectable({ providedIn: 'root' })
export class GetSalesHistoryUseCase {
  private readonly saleRepository = inject(SaleRepository);
  private readonly userRepository = inject(UserRepository);

  execute(filters?: SalesListFilters): Observable<SaleHistory[]> {
    return forkJoin({
      sales: this.saleRepository.getSales(filters),
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

  executePaginated(params: SalesHistoryPageParams): Observable<PaginatedResponse<SaleHistory>> {
    return forkJoin({
      sales: this.saleRepository.getSalesPaginated(params),
      users: this.userRepository.getUsers(),
    }).pipe(
      map(({ sales, users }) => {
        const usersMap = new Map(users.map((u) => [u.id, u.username]));

        return {
          ...sales,
          data: sales.data.map(
            (sale) =>
              ({
                ...sale,
                usuarioNombre: usersMap.get(sale.idUsuario ?? -1) ?? 'Usuario Desconocido',
              }) as SaleHistory,
          ),
        };
      })
    );
  }
}
