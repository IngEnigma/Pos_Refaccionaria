import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { SaleRepositoryImpl } from './sale-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { CreateSalePayload } from '@features/sales/domain/repository/sale-repository';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { LogLevel } from '@core/logging/log-level.enum';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';

const envStub: Environment = {
  apiUrl: 'http://api.test',
  production: false,
  loggingLevel: 0,
};

describe('SaleRepositoryImpl', () => {
  let repository: SaleRepositoryImpl;
  let httpMock: HttpTestingController;
  let loggerPort: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    loggerPort = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        SaleRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
        { provide: LOGGER_PORT, useValue: loggerPort },
      ],
    });

    repository = TestBed.inject(SaleRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates sale via POST and maps response', () => {
    const payload: CreateSalePayload = {
      idUsuario: 1,
      idMetodoPago: 2,
      productos: [{ id: 10, cantidad: 1 }],
    };
    const response: SaleResponseDto = {
      id: 100,
      id_usuario: 1,
      id_metodoPago: 2,
      total: '99.50',
      fecha: '2024-01-01',
    };

    repository.createSale(payload).subscribe((sale) => {
      expect(sale.id).toBe(100);
      expect(sale.total).toBe(99.5);
      expect(sale.idUsuario).toBe(1);
      expect(sale.idMetodoPago).toBe(2);
    });

    const expectedUrl = `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_usuario: 1,
      id_metodoPago: 2,
      productos: [{ id: 10, cantidad: 1 }],
    });
    req.flush(response);
  });

  it('gets sales via GET and maps response', () => {
    const response: SaleResponseDto[] = [
      {
        id: 1,
        id_usuario: 2,
        id_metodoPago: 3,
        total: '150',
        fecha: null,
      },
    ];

    repository.getSales().subscribe((sales) => {
      expect(sales).toHaveLength(1);
      expect(sales[0].id).toBe(1);
      expect(sales[0].total).toBe(150);
    });

    const expectedUrl = `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });
});
