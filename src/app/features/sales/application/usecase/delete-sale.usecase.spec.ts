import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { DeleteSaleUseCase } from './delete-sale.usecase';

describe('DeleteSaleUseCase', () => {
  let useCase: DeleteSaleUseCase;
  let repository: { deleteSale: jest.Mock };

  beforeEach(() => {
    repository = { deleteSale: jest.fn() };

    TestBed.configureTestingModule({
      providers: [DeleteSaleUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(DeleteSaleUseCase);
  });

  // Camino feliz: delega el id al repositorio y devuelve su confirmación.
  it('elimina la venta delegando el id al repositorio', async () => {
    repository.deleteSale.mockReturnValue(of(true));

    const result = await firstValueFrom(useCase.execute(9));

    expect(result).toBe(true);
    expect(repository.deleteSale).toHaveBeenCalledWith(9);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.deleteSale.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(9))).rejects.toBe(error);
  });
});
