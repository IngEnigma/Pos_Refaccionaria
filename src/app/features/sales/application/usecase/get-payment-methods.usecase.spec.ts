import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { PaymentMethodRepository } from '@features/sales/domain/repository/payment-method-repository';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { GetPaymentMethodsUseCase } from './get-payment-methods.usecase';

describe('GetPaymentMethodsUseCase', () => {
  let useCase: GetPaymentMethodsUseCase;
  let repository: { getPaymentMethods: jest.Mock };

  const methods: PaymentMethod[] = [
    { id: 1, tipo: 'EFECTIVO', descripcion: 'Pago en efectivo' },
    { id: 2, tipo: 'TARJETA', descripcion: 'Pago con tarjeta' },
  ];

  beforeEach(() => {
    repository = { getPaymentMethods: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetPaymentMethodsUseCase, { provide: PaymentMethodRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetPaymentMethodsUseCase);
  });

  // Camino feliz: devuelve los métodos de pago del repositorio.
  it('devuelve los métodos de pago del repositorio', async () => {
    repository.getPaymentMethods.mockReturnValue(of(methods));

    await expect(firstValueFrom(useCase.execute())).resolves.toBe(methods);
    expect(repository.getPaymentMethods).toHaveBeenCalledTimes(1);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('fallo backend');
    repository.getPaymentMethods.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
