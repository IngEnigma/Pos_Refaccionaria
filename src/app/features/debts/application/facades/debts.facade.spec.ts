import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, of, throwError } from 'rxjs';

import { GetClientsUseCase } from '@features/clients/application/usecase/get-clients.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { DebtRepository } from '../../domain/debt';
import { DebtsFacade } from './debts.facade';

describe('DebtsFacade', () => {
  const repo = { getDebts: jest.fn(), createDebt: jest.fn(), cancelDebt: jest.fn(), getPayments: jest.fn(), addPayment: jest.fn() };
  const get = () => TestBed.inject(DebtsFacade);

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: DebtRepository, useValue: repo },
        { provide: GetClientsUseCase, useValue: { execute: () => of([]) } },
        { provide: GetPaymentMethodsUseCase, useValue: { execute: () => of([]) } },
      ],
    });
  });

  it('loadDebts guarda la lista y apaga loading', () => {
    repo.getDebts.mockReturnValue(of([{ id: 1 }]));
    const f = get();
    f.loadDebts('pendiente');
    expect(repo.getDebts).toHaveBeenCalledWith('pendiente');
    expect(f.debts()).toHaveLength(1);
    expect(f.loading()).toBe(false);
  });

  it('loadDebts con error deja lista vacía y mensaje del back', () => {
    repo.getDebts.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'sucursal_id debe ser entero' } })));
    const f = get();
    f.loadDebts();
    expect(f.debts()).toEqual([]);
    expect(f.errorMessage()).toBe('sucursal_id debe ser entero');
  });

  it('addPayment propaga el error y publica el mensaje', async () => {
    repo.addPayment.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'El abono no puede exceder el saldo pendiente' } })));
    const f = get();
    await expect(lastValueFrom(f.addPayment(1, 999, null))).rejects.toBeDefined();
    expect(f.errorMessage()).toBe('El abono no puede exceder el saldo pendiente');
    expect(f.loading()).toBe(false);
  });
});
