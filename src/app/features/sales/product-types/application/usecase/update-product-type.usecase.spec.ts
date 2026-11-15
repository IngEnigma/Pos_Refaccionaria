import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { UpdateProductTypeUseCase } from './update-product-type.usecase';

describe('UpdateProductTypeUseCase', () => {
  let useCase: UpdateProductTypeUseCase;
  let repository: { updateProductType: jest.Mock };

  const updated: ProductType = { id: 3, nombre: 'Frenos y clutch' };

  beforeEach(() => {
    repository = { updateProductType: jest.fn().mockReturnValue(of(updated)) };

    TestBed.configureTestingModule({
      providers: [UpdateProductTypeUseCase, { provide: ProductTypeRepository, useValue: repository }],
    });

    useCase = TestBed.inject(UpdateProductTypeUseCase);
  });

  // Camino feliz: nombre válido se delega al repositorio junto con el id.
  it('actualiza el tipo delegando id y payload al repositorio', async () => {
    const result = await firstValueFrom(useCase.execute(3, { nombre: 'Frenos y clutch' }));

    expect(result).toBe(updated);
    expect(repository.updateProductType).toHaveBeenCalledWith(3, { nombre: 'Frenos y clutch' });
  });

  // Campo opcional: sin nombre no hay validación y se delega igual.
  it('acepta un payload sin nombre', async () => {
    await firstValueFrom(useCase.execute(3, {}));

    expect(repository.updateProductType).toHaveBeenCalledWith(3, {});
  });

  // Validación: nombre vacío o solo espacios se rechaza sin llamar al repositorio.
  it.each([[''], ['   ']])('lanza error si el nombre es %p', (nombre) => {
    expect(() => useCase.execute(3, { nombre })).toThrow('UpdateProductType: nombre cannot be empty');
    expect(repository.updateProductType).not.toHaveBeenCalled();
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.updateProductType.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(3, { nombre: 'X' }))).rejects.toBe(error);
  });
});
