import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { UpdateSaleDetailUseCase } from './update-sale-detail.usecase';

describe('UpdateSaleDetailUseCase', () => {
  let useCase: UpdateSaleDetailUseCase;
  let repository: { updateSaleDetail: jest.Mock };

  const detail: SaleDetail = { id: 4, productId: 10, saleId: 50, subtotal: 300, cantidad: 3 };

  beforeEach(() => {
    repository = { updateSaleDetail: jest.fn().mockReturnValue(of(detail)) };

    TestBed.configureTestingModule({
      providers: [UpdateSaleDetailUseCase, { provide: SaleDetailRepository, useValue: repository }],
    });

    useCase = TestBed.inject(UpdateSaleDetailUseCase);
  });

  // Camino feliz: cantidad válida se delega al repositorio con el id.
  it('actualiza el detalle delegando id y payload al repositorio', async () => {
    const result = await firstValueFrom(useCase.execute(4, { cantidad: 3 }));

    expect(result).toBe(detail);
    expect(repository.updateSaleDetail).toHaveBeenCalledWith(4, { cantidad: 3 });
  });

  // Campos opcionales: sin cantidad no hay validación y se delega igual.
  it('acepta un payload sin cantidad', async () => {
    await firstValueFrom(useCase.execute(4, { productId: 11 }));

    expect(repository.updateSaleDetail).toHaveBeenCalledWith(4, { productId: 11 });
  });

  // Validación: cantidad cero, negativa, NaN o infinita se rechaza sin llamar al repositorio.
  it.each([[0], [-1], [NaN], [Infinity]])('lanza error si la cantidad es %p', (cantidad) => {
    expect(() => useCase.execute(4, { cantidad })).toThrow(
      'UpdateSaleDetail.cantidad: quantity must be greater than zero',
    );
    expect(repository.updateSaleDetail).not.toHaveBeenCalled();
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.updateSaleDetail.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(4, { cantidad: 1 }))).rejects.toBe(error);
  });
});
