import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';

import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { SaleHistory } from '../../domain/entities/sale-history.entity';

@Injectable({ providedIn: 'root' })
export class GetSalesHistoryUseCase {
  private readonly saleRepository = inject(SaleRepository);
  private readonly userRepository = inject(UserRepository);
  private readonly sessionState = inject(SessionStateService);

  execute(): Observable<SaleHistory[]> {
    const session = this.sessionState.getSession();
    // H-F1-1: /users es 403 para cajeros (y el interceptor los manda a /forbidden): solo se pide a manager/admin.
    // Un cajero solo conoce su propio usuario; el back no incluye el nombre en cada venta (H-F1-2).
    const users$ =
      session?.role === 'seller'
        ? of(session ? [{ id: Number(session.userId), username: session.username }] : [])
        : this.userRepository.getUsers();

    return forkJoin({ sales: this.saleRepository.getSales(), users: users$ }).pipe(
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
