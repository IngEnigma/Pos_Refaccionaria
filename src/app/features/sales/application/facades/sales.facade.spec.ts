import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SalesFacade } from './sales.facade';
import { CreateSaleUseCase } from '@features/sales/application/usecase/create-sale.usecase';
import { CreateCompleteSaleUseCase } from '@features/sales/application/usecase/create-complete-sale.usecase';
import { GetSalesUseCase } from '@features/sales/application/usecase/get-sales.usecase';
import { GetPaymentMethodsUseCase } from '@features/sales/application/usecase/get-payment-methods.usecase';
import { GetSaleDetailUseCase } from '@features/sales/application/usecase/get-sale-detail.usecase';
import { GetSaleDetailsUseCase } from '@features/sales/application/usecase/get-sale-details.usecase';
import { CreateSaleDetailUseCase } from '@features/sales/application/usecase/create-sale-detail.usecase';
import { UpdateSaleDetailUseCase } from '@features/sales/application/usecase/update-sale-detail.usecase';
import { DeleteSaleDetailUseCase } from '@features/sales/application/usecase/delete-sale-detail.usecase';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { Sale, SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { CreateSalePayload, CreateCompleteSalePayload } from '@features/sales/domain/repository/sale-repository';
import { SaleFetchError } from '@features/sales/domain/errors/sales.errors';
import { SessionStateService } from '@features/auth/application/services/session-state.service';

describe('SalesFacade', () => {
  let facade: SalesFacade;
  let createSaleUseCase: jest.Mocked<Partial<CreateSaleUseCase>>;
  let createCompleteSaleUseCase: jest.Mocked<Partial<CreateCompleteSaleUseCase>>;
  let getSalesUseCase: jest.Mocked<Partial<GetSalesUseCase>>;
  let getPaymentMethodsUseCase: jest.Mocked<Partial<GetPaymentMethodsUseCase>>;
  let loggerPort: jest.Mocked<Partial<LoggerPort>>;
  let sessionStateService: jest.Mocked<Partial<SessionStateService>>;

  beforeEach(() => {
    createSaleUseCase = { execute: jest.fn() };
    createCompleteSaleUseCase = { execute: jest.fn() };
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
        { provide: CreateCompleteSaleUseCase, useValue: createCompleteSaleUseCase },
        { provide: GetSaleDetailUseCase, useValue: { execute: jest.fn() } },
        { provide: GetSaleDetailsUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateSaleDetailUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateSaleDetailUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteSaleDetailUseCase, useValue: { execute: jest.fn() } },
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
      idMetodoPago: 2,
    };
    const sale: Sale = SaleFactory.fromPrimitives({
      id: 99,
      idUsuario: 1,
      idInventario: 1,
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

  it('creates a complete sale (venta + detalles) with rollback support', () => {
    const payload: CreateCompleteSalePayload = {
      idMetodoPago: 1,
      productos: [{ id: 10, cantidad: 2 }],
    };
    const sale: Sale = SaleFactory.fromPrimitives({
      id: 50,
      idUsuario: 1,
      idInventario: 5,
      idMetodoPago: 1,
      total: 200,
      fecha: '2024-01-01',
    });
    (createCompleteSaleUseCase.execute as jest.Mock).mockReturnValue(of(sale));
    facade.createCompleteSale(payload).subscribe((result) => {
      expect(result).toEqual(sale);
    });
    expect(createCompleteSaleUseCase.execute).toHaveBeenCalledWith(payload);
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
