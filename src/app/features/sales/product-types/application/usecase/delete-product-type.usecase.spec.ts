import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { DeleteProductTypeUseCase } from './delete-product-type.usecase';

describe('DeleteProductTypeUseCase', () => {
  let useCase: DeleteProductTypeUseCase;
  let repository: { deleteProductType: jest.Mock };

  beforeEach(() => {
    repository = { deleteProductType: jest.fn() };

    TestBed.configureTestingModule({
      providers: [DeleteProductTypeUseCase, { provide: ProductTypeRepository, useValue: repository }],
    });

    useCase = TestBed.inject(DeleteProductTypeUseCase);
  });

  // Camino feliz: delega el id al repositorio y devuelve su confirmación.
  it('elimina el tipo delegando el id al repositorio', async () => {
    repository.deleteProductType.mockReturnValue(of(true));

    await expect(firstValueFrom(useCase.execute(3))).resolves.toBe(true);
    expect(repository.deleteProductType).toHaveBeenCalledWith(3);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.deleteProductType.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(3))).rejects.toBe(error);
  });
});
