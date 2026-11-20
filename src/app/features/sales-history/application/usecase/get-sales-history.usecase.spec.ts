import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { GetSalesHistoryUseCase } from './get-sales-history.usecase';

describe('GetSalesHistoryUseCase', () => {
  const sale = (idUsuario: number | null) =>
    new Sale({ id: 1, idUsuario, idSucursal: 1, idMetodoPago: 1, total: 10, fecha: null });

  function setup(role: string, sales: Sale[]) {
    const getUsers = jest.fn(() => of([{ id: 3, username: 'ana.centro' }, { id: 4, username: 'carlos.centro' }]));
    TestBed.configureTestingModule({
      providers: [
        { provide: SaleRepository, useValue: { getSales: () => of(sales) } },
        { provide: UserRepository, useValue: { getUsers } },
        { provide: SessionStateService, useValue: { getSession: () => ({ role, userId: '3', username: 'ana.centro' }) } },
      ],
    });
    return { useCase: TestBed.inject(GetSalesHistoryUseCase), getUsers };
  }

  // H-F1-1: /users es 403 para cajeros (el interceptor los manda a /forbidden): no se pide.
  it('cajero: no consulta /users, rotula sus ventas con su usuario y las ajenas como desconocidas', (done) => {
    const { useCase, getUsers } = setup('seller', [sale(3), sale(4)]);

    useCase.execute().subscribe((h) => {
      expect(getUsers).not.toHaveBeenCalled();
      expect(h.map((s) => s.usuarioNombre)).toEqual(['ana.centro', 'Usuario Desconocido']);
      done();
    });
  });

  it('manager/admin: resuelve el nombre con /users', (done) => {
    const { useCase, getUsers } = setup('manager', [sale(4)]);

    useCase.execute().subscribe((h) => {
      expect(getUsers).toHaveBeenCalled();
      expect(h[0].usuarioNombre).toBe('carlos.centro');
      done();
    });
  });
});
