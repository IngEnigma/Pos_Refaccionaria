import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  CreateSaleDetailPayload,
  SaleDetailRepository,
} from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { CreateSaleDetailUseCase } from './create-sale-detail.usecase';

describe('CreateSaleDetailUseCase', () => {
  let useCase: CreateSaleDetailUseCase;
  let repository: { createSaleDetail: jest.Mock };

  const payload: CreateSaleDetailPayload = { productId: 10, saleId: 50, cantidad: 2 };
  const detail: SaleDetail = { id: 1, productId: 10, saleId: 50, subtotal: 100, cantidad: 2 };

  beforeEach(() => {
    repository = { createSaleDetail: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CreateSaleDetailUseCase, { provide: SaleDetailRepository, useValue: repository }],
    });

    useCase = TestBed.inject(CreateSaleDetailUseCase);
  });

  // Camino feliz: payload válido se delega al repositorio y se devuelve el detalle.
  it('crea el detalle delegando el payload al repositorio', async () => {
    repository.createSaleDetail.mockReturnValue(of(detail));

    const result = await firstValueFrom(useCase.execute(payload));

    expect(result).toBe(detail);
    expect(repository.createSaleDetail).toHaveBeenCalledWith(payload);
  });

  // Validación de cantidad: cero, negativa, NaN o infinita se rechazan sin llamar al repositorio.
  it.each([[0], [-1], [NaN], [Infinity]])(
    'lanza error si la cantidad es %p y no llama al repositorio',
    (cantidad) => {
      expect(() => useCase.execute({ ...payload, cantidad })).toThrow(
        'CreateSaleDetail.cantidad: quantity must be greater than zero',
      );
      expect(repository.createSaleDetail).not.toHaveBeenCalled();
    },
  );

  // Validación de producto: id 0 o ausente se rechaza.
  it.each([[0], [undefined]])('lanza error si productId es %p', (productId) => {
    const invalid = { ...payload, productId } as unknown as CreateSaleDetailPayload;

    expect(() => useCase.execute(invalid)).toThrow('CreateSaleDetail: productId requerido');
    expect(repository.createSaleDetail).not.toHaveBeenCalled();
  });

  // Validación de venta: id 0 o ausente se rechaza.
  it.each([[0], [undefined]])('lanza error si saleId es %p', (saleId) => {
    const invalid = { ...payload, saleId } as unknown as CreateSaleDetailPayload;

    expect(() => useCase.execute(invalid)).toThrow('CreateSaleDetail: saleId requerido');
    expect(repository.createSaleDetail).not.toHaveBeenCalled();
  });

  // Orden de validaciones: la cantidad se evalúa antes que los ids.
  it('reporta primero la cantidad inválida cuando también faltan los ids', () => {
    expect(() => useCase.execute({ productId: 0, saleId: 0, cantidad: 0 })).toThrow(
      'CreateSaleDetail.cantidad',
    );
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('stock insuficiente');
    repository.createSaleDetail.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(payload))).rejects.toBe(error);
  });
});
