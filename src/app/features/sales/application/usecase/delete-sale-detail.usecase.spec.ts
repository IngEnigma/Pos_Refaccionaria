import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { DeleteSaleDetailUseCase } from './delete-sale-detail.usecase';

describe('DeleteSaleDetailUseCase', () => {
  let useCase: DeleteSaleDetailUseCase;
  let repository: { deleteSaleDetail: jest.Mock };

  beforeEach(() => {
    repository = { deleteSaleDetail: jest.fn() };

    TestBed.configureTestingModule({
      providers: [DeleteSaleDetailUseCase, { provide: SaleDetailRepository, useValue: repository }],
    });

    useCase = TestBed.inject(DeleteSaleDetailUseCase);
  });

  // Camino feliz: delega el id al repositorio y devuelve su confirmación.
  it('elimina el detalle delegando el id al repositorio', async () => {
    repository.deleteSaleDetail.mockReturnValue(of(true));

    const result = await firstValueFrom(useCase.execute(9));

    expect(result).toBe(true);
    expect(repository.deleteSaleDetail).toHaveBeenCalledWith(9);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.deleteSaleDetail.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(9))).rejects.toBe(error);
  });
});
