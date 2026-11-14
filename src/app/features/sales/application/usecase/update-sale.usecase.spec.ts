import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { UpdateSaleUseCase } from './update-sale.usecase';

describe('UpdateSaleUseCase', () => {
  let useCase: UpdateSaleUseCase;
  let repository: { updateSale: jest.Mock };

  const sale = SaleFactory.fromPrimitives({
    id: 7,
    idUsuario: 1,
    idInventario: 2,
    idMetodoPago: 3,
    total: 150,
    fecha: '2024-01-01',
  });

  beforeEach(() => {
    repository = { updateSale: jest.fn().mockReturnValue(of(sale)) };

    TestBed.configureTestingModule({
      providers: [UpdateSaleUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(UpdateSaleUseCase);
  });

  // Camino feliz: total y fecha válidos se delegan al repositorio junto con el id.
  it('actualiza la venta delegando id y payload al repositorio', async () => {
    const payload = { total: 99.5, fecha: '2024-02-01T10:00:00Z' };

    const result = await firstValueFrom(useCase.execute(7, payload));

    expect(result).toBe(sale);
    expect(repository.updateSale).toHaveBeenCalledWith(7, payload);
  });

  // Campos opcionales: sin total ni fecha no hay validación y se delega igual.
  it('acepta un payload sin total ni fecha', async () => {
    await firstValueFrom(useCase.execute(7, { idMetodoPago: 2 }));

    expect(repository.updateSale).toHaveBeenCalledWith(7, { idMetodoPago: 2 });
  });

  // Límite: total 0 es un monto no negativo válido.
  it('acepta total igual a cero', async () => {
    await firstValueFrom(useCase.execute(7, { total: 0 }));

    expect(repository.updateSale).toHaveBeenCalledWith(7, { total: 0 });
  });

  // Validación de total: negativo, NaN o infinito se rechazan sin llamar al repositorio.
  it.each([[-1], [NaN], [Infinity]])('lanza error si el total es %p', (total) => {
    expect(() => useCase.execute(7, { total })).toThrow(
      'UpdateSale.total: money must be a non-negative number',
    );
    expect(repository.updateSale).not.toHaveBeenCalled();
  });

  // Validación de fecha: un texto que no es fecha ISO se rechaza sin llamar al repositorio.
  it('lanza error si la fecha no es una fecha ISO válida', () => {
    expect(() => useCase.execute(7, { fecha: 'ayer' })).toThrow(
      'UpdateSale.fecha: sale date must be an ISO date string',
    );
    expect(repository.updateSale).not.toHaveBeenCalled();
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.updateSale.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(7, { total: 10 }))).rejects.toBe(error);
  });
});
