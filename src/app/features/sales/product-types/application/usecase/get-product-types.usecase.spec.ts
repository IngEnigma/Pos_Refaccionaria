import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { GetProductTypesUseCase } from './get-product-types.usecase';

describe('GetProductTypesUseCase', () => {
  let useCase: GetProductTypesUseCase;
  let repository: { getProductTypes: jest.Mock };

  const types: ProductType[] = [
    { id: 1, nombre: 'Frenos' },
    { id: 2, nombre: 'Filtros' },
  ];

  beforeEach(() => {
    repository = { getProductTypes: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetProductTypesUseCase, { provide: ProductTypeRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetProductTypesUseCase);
  });

  // Camino feliz: devuelve los tipos del repositorio.
  it('devuelve los tipos de producto del repositorio', async () => {
    repository.getProductTypes.mockReturnValue(of(types));

    await expect(firstValueFrom(useCase.execute())).resolves.toBe(types);
    expect(repository.getProductTypes).toHaveBeenCalledTimes(1);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.getProductTypes.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
