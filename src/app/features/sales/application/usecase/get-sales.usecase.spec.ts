import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { GetSalesUseCase } from './get-sales.usecase';

describe('GetSalesUseCase', () => {
  let useCase: GetSalesUseCase;
  let repository: { getSales: jest.Mock };

  const sales = [1, 2].map((id) =>
    SaleFactory.fromPrimitives({
      id,
      idUsuario: 1,
      idSucursal: 2,
      idMetodoPago: 3,
      total: 10 * id,
      fecha: '2024-01-01',
    }),
  );

  beforeEach(() => {
    repository = { getSales: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetSalesUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetSalesUseCase);
  });

  // Camino feliz: devuelve la lista del repositorio.
  it('devuelve las ventas del repositorio', async () => {
    repository.getSales.mockReturnValue(of(sales));

    await expect(firstValueFrom(useCase.execute())).resolves.toBe(sales);
    expect(repository.getSales).toHaveBeenCalledTimes(1);
  });

  // Lista vacía: no se trata como error.
  it('devuelve una lista vacía cuando no hay ventas', async () => {
    repository.getSales.mockReturnValue(of([]));

    await expect(firstValueFrom(useCase.execute())).resolves.toEqual([]);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.getSales.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
