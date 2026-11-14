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
      idMetodoPago: 2,
      productos: [{ id: 10, cantidad: 2 }],
    };
    const response: SaleResponseDto = {
      id: 100,
      id_usuario: 1,
      id_inventario: 1,
      id_metodoPago: 2,
      total: '99.50',
      fecha: '2024-01-01',
    };

    repository.createSale(payload).subscribe((sale) => {
      expect(sale.id).toBe(100);
      expect(sale.total.value).toBe(99.5);
      expect(sale.idUsuario).toBe(1);
      expect(sale.idMetodoPago).toBe(2);
      expect(sale.idInventario).toBe(1);
    });

    const expectedUrl = `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_metodoPago: 2,
      detalles: [{ producto: 10, cantidad: 2 }],
    });
    req.flush(response);
  });

  it('gets sale detail via ticket endpoint', () => {
    const ticket = {
      folio: 10,
      fecha: '2024-01-01T00:00:00Z',
      vendedor: 'admin',
      metodo_pago: 'EFECTIVO',
      sucursal: 'Sucursal 1',
      productos: [{ nombre: 'Prod', cantidad: 2, precio_unitario: '50.00', subtotal: '100.00' }],
      total: '100.00',
    };
    repository.getSaleDetail(10).subscribe((detail) => {
      expect(detail.id).toBe(10);
      expect(detail.total.value).toBe(100);
      expect(detail.detalles.length).toBe(1);
    });
    const expectedUrl = `${envStub.apiUrl}${SALE_ENDPOINTS.TICKET}10/ticket/`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(ticket);
  });

  it('gets sales via GET and maps response', () => {
    const response: SaleResponseDto[] = [
      {
        id: 1,
        id_usuario: 2,
        id_inventario: 1,
        id_metodoPago: 3,
        total: '150',
        fecha: null,
      },
    ];

    repository.getSales().subscribe((sales) => {
      expect(sales).toHaveLength(1);
      expect(sales[0].id).toBe(1);
      expect(sales[0].total.value).toBe(150);
    });

    const expectedUrl = `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}`;
    const req = httpMock.expectOne((request) => request.url === expectedUrl && request.method === 'GET');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('gets paginated sales via GET with page/page_size and maps results', () => {
    repository.getSalesPaginated({ page: 2, pageSize: 10 }).subscribe((paginated) => {
      expect(paginated.total).toBe(25);
      expect(paginated.page).toBe(2);
      expect(paginated.limit).toBe(10);
      expect(paginated.data).toHaveLength(1);
      expect(paginated.data[0].id).toBe(11);
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}` && request.method === 'GET',
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('page_size')).toBe('10');
    req.flush({
      total: 25,
      page: 2,
      page_size: 10,
      total_pages: 3,
      sucursal_id: null,
      results: [
        { id: 11, id_usuario: 2, id_inventario: 1, id_metodoPago: 1, total: '200', fecha: null },
      ],
    });
  });

  it('sends sucursal_id and id_inventario filters when provided', () => {
    repository.getSalesPaginated({ page: 1, pageSize: 10, sucursalId: 3, idInventario: 7 }).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${envStub.apiUrl}${SALE_ENDPOINTS.BASE}` && request.method === 'GET',
    );
    expect(req.request.params.get('sucursal_id')).toBe('3');
    expect(req.request.params.get('id_inventario')).toBe('7');
    req.flush({ total: 0, page: 1, page_size: 10, total_pages: 0, sucursal_id: 3, results: [] });
  });
});
