import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { CreateSaleUseCase } from './create-sale.usecase';

describe('CreateSaleUseCase', () => {
  let useCase: CreateSaleUseCase;
  let repository: { createSale: jest.Mock };

  const sale = SaleFactory.fromPrimitives({
    id: 7,
    idUsuario: 1,
    idInventario: 2,
    idMetodoPago: 3,
    total: 150,
    fecha: '2024-01-01',
  });

  beforeEach(() => {
    repository = { createSale: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CreateSaleUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(CreateSaleUseCase);
  });

  // Camino feliz: delega el payload tal cual al repositorio y devuelve la venta creada.
  it('crea la venta delegando el payload al repositorio', async () => {
    repository.createSale.mockReturnValue(of(sale));

    const result = await firstValueFrom(useCase.execute({ idMetodoPago: 3, idCliente: 25 }));

    expect(result).toBe(sale);
    expect(repository.createSale).toHaveBeenCalledWith({ idMetodoPago: 3, idCliente: 25 });
  });

  // Público general: sin idCliente el payload se reenvía sin ese campo.
  it('permite crear la venta sin cliente (Público general)', async () => {
    repository.createSale.mockReturnValue(of(sale));

    await firstValueFrom(useCase.execute({ idMetodoPago: 3 }));

    expect(repository.createSale.mock.calls[0][0]).not.toHaveProperty('idCliente');
  });

  // Validación: un método de pago ausente o 0 se rechaza antes de tocar el repositorio.
  it.each([[0], [undefined], [null]])(
    'lanza error si idMetodoPago es %p y no llama al repositorio',
    (idMetodoPago) => {
      const payload = { idMetodoPago } as unknown as { idMetodoPago: number };

      expect(() => useCase.execute(payload)).toThrow('CreateSale: idMetodoPago requerido');
      expect(repository.createSale).not.toHaveBeenCalled();
    },
  );

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.createSale.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute({ idMetodoPago: 3 }))).rejects.toBe(error);
  });
});
