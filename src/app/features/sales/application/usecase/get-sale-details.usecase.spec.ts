import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { GetSaleDetailsUseCase } from './get-sale-details.usecase';

describe('GetSaleDetailsUseCase', () => {
  let useCase: GetSaleDetailsUseCase;
  let repository: { getSaleDetails: jest.Mock };

  const details: SaleDetail[] = [
    { id: 1, productId: 10, saleId: 50, subtotal: 100, cantidad: 1 },
    { id: 2, productId: 20, saleId: 50, subtotal: 300, cantidad: 3 },
  ];

  beforeEach(() => {
    repository = { getSaleDetails: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetSaleDetailsUseCase, { provide: SaleDetailRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetSaleDetailsUseCase);
  });

  // Camino feliz: devuelve los detalles del repositorio.
  it('devuelve los detalles de venta del repositorio', async () => {
    repository.getSaleDetails.mockReturnValue(of(details));

    await expect(firstValueFrom(useCase.execute())).resolves.toBe(details);
    expect(repository.getSaleDetails).toHaveBeenCalledTimes(1);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.getSaleDetails.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
