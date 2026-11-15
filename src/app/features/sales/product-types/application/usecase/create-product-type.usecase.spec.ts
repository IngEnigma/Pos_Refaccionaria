import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { CreateProductTypeUseCase } from './create-product-type.usecase';

describe('CreateProductTypeUseCase', () => {
  let useCase: CreateProductTypeUseCase;
  let repository: { createProductType: jest.Mock };

  const created: ProductType = { id: 3, nombre: 'Frenos' };

  beforeEach(() => {
    repository = { createProductType: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CreateProductTypeUseCase, { provide: ProductTypeRepository, useValue: repository }],
    });

    useCase = TestBed.inject(CreateProductTypeUseCase);
  });

  // Camino feliz: nombre válido se delega al repositorio y se devuelve el tipo creado.
  it('crea el tipo de producto delegando el payload al repositorio', async () => {
    repository.createProductType.mockReturnValue(of(created));

    const result = await firstValueFrom(useCase.execute({ nombre: 'Frenos' }));

    expect(result).toBe(created);
    expect(repository.createProductType).toHaveBeenCalledWith({ nombre: 'Frenos' });
  });

  // Validación: nombre vacío o solo espacios se rechaza sin llamar al repositorio.
  it.each([[''], ['   '], ['\t\n']])('lanza error si el nombre es %p', (nombre) => {
    expect(() => useCase.execute({ nombre })).toThrow('CreateProductType: nombre is required');
    expect(repository.createProductType).not.toHaveBeenCalled();
  });

  // El nombre solo se valida con trim: el payload llega al repositorio sin modificar.
  it('no altera el payload cuando el nombre trae espacios alrededor', async () => {
    repository.createProductType.mockReturnValue(of(created));

    await firstValueFrom(useCase.execute({ nombre: '  Frenos ' }));

    expect(repository.createProductType).toHaveBeenCalledWith({ nombre: '  Frenos ' });
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.createProductType.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute({ nombre: 'Frenos' }))).rejects.toBe(error);
  });
});
