import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { DetailedSale } from '@features/sales/domain/entities/detailed-sale.entity';
import { GetSaleDetailUseCase } from './get-sale-detail.usecase';

describe('GetSaleDetailUseCase', () => {
  let useCase: GetSaleDetailUseCase;
  let repository: { getSaleDetail: jest.Mock };

  const detailed = new DetailedSale({
    id: 12,
    idInventario: 2,
    fecha: '2024-01-01',
    subtotal: 120,
    iva: 19.2,
    total: 139.2,
    detalles: [],
  });

  beforeEach(() => {
    repository = { getSaleDetail: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetSaleDetailUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetSaleDetailUseCase);
  });

  // Camino feliz: pide al repositorio la venta por id y devuelve el detalle.
  it('devuelve el detalle de la venta pedida', async () => {
    repository.getSaleDetail.mockReturnValue(of(detailed));

    await expect(firstValueFrom(useCase.execute(12))).resolves.toBe(detailed);
    expect(repository.getSaleDetail).toHaveBeenCalledWith(12);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('venta no encontrada');
    repository.getSaleDetail.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(12))).rejects.toBe(error);
  });
});
