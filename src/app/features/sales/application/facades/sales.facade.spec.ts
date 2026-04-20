import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SalesFacade } from './sales.facade';
import { CreateSaleUseCase } from '@features/sales/application/usecase/create-sale.usecase';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { Sale, SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { CreateSalePayload } from '@features/sales/domain/repository/sale-repository';
import { SaleFetchError } from '@features/sales/domain/errors/sales.errors';
import { SessionStateService } from '@features/auth/application/services/session-state.service';

describe('SalesFacade', () => {
  let facade: SalesFacade;
  let createSaleUseCase: jest.Mocked<Partial<CreateSaleUseCase>>;
  let getSalesUseCase: jest.Mocked<Partial<GetSalesUseCase>>;
  let getPaymentMethodsUseCase: jest.Mocked<Partial<GetPaymentMethodsUseCase>>;
  let loggerPort: jest.Mocked<Partial<LoggerPort>>;
  let sessionStateService: jest.Mocked<Partial<SessionStateService>>;

  beforeEach(() => {
    createSaleUseCase = { execute: jest.fn() };
    getSalesUseCase = { execute: jest.fn() };
    getPaymentMethodsUseCase = { execute: jest.fn() };
    
    loggerPort = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    sessionStateService = {
      getSession: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SalesFacade,
        { provide: CreateSaleUseCase, useValue: createSaleUseCase },
        { provide: GetSalesUseCase, useValue: getSalesUseCase },
        { provide: GetPaymentMethodsUseCase, useValue: getPaymentMethodsUseCase },
        { provide: LOGGER_PORT, useValue: loggerPort },
        { provide: SessionStateService, useValue: sessionStateService },
      ],
    });

    facade = TestBed.inject(SalesFacade);
  });

  it('creates a sale successfully', () => {
    const payload: CreateSalePayload = {
      idUsuario: 1,
      idMetodoPago: 2,
      productos: [{ id: 10, cantidad: 2 }],
    };
    const sale: Sale = SaleFactory.fromPrimitives({
      id: 99,
      idUsuario: 1,
      idMetodoPago: 2,
      total: 120,
      fecha: '2024-01-01',
    });

    (createSaleUseCase.execute as jest.Mock).mockReturnValue(of(sale));
    (sessionStateService.getSession as jest.Mock).mockReturnValue({ userId: '1' });

    facade.createSale(payload).subscribe((result) => {
      expect(result).toEqual(sale);
    });

    expect(createSaleUseCase.execute).toHaveBeenCalled();
  });

  it('handles error when loading sales', () => {
    (getSalesUseCase.execute as jest.Mock).mockReturnValue(
      throwError(() => new SaleFetchError('Falló la carga')),
    );

    facade.loadSales();

    expect(facade.isLoadingSales()).toBe(false);
    expect(facade.errorMessage()).toBe('Falló la carga');
    expect(loggerPort.error).toHaveBeenCalled();
  });
});
