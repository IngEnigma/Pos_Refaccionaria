import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { Environment } from '@env/environment.model';
import { BranchPriceResponseDto } from '@features/branch-pricing/application/dtos/branch-price-response.dto';
import { PriceHistoryResponseDto } from '@features/branch-pricing/application/dtos/price-history-response.dto';
import { BranchPriceRepositoryImpl } from './branch-price-repository.impl';

const envStub: Environment = {
  apiUrl: 'http://api.test',
  production: false,
  loggingLevel: 0,
};

const endpoint = `${envStub.apiUrl}/precios-sucursal`;

const priceDto: BranchPriceResponseDto = {
  id: 11,
  id_producto: 5,
  id_sucursal: 2,
  precio_venta: '12.50',
  vigente_desde: '2026-03-01T10:00:00-06:00',
  activo: true,
};

describe('BranchPriceRepositoryImpl', () => {
  let repository: BranchPriceRepositoryImpl;
  let httpMock: HttpTestingController;

  function setup(withSlashInterceptor = false): void {
    TestBed.configureTestingModule({
      providers: [
        BranchPriceRepositoryImpl,
        provideHttpClient(...(withSlashInterceptor ? [withInterceptors([trailingSlashInterceptor])] : [])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(BranchPriceRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock.verify());

  describe('getActivePrice', () => {
    beforeEach(() => setup());

    it('hace GET a /precios-sucursal/activo/ con id_producto e id_sucursal y mapea el precio', () => {
      let result: unknown;

      repository.getActivePrice(5, 2).subscribe((price) => (result = price));

      const req = httpMock.expectOne((r) => r.url === `${endpoint}/activo/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('id_producto')).toBe('5');
      expect(req.request.params.get('id_sucursal')).toBe('2');
      req.flush(priceDto);
      expect(result).toEqual({
        id: 11,
        idProducto: 5,
        idSucursal: 2,
        precioVenta: 12.5,
        vigenteDesde: '2026-03-01T10:00:00-06:00',
        activo: true,
      });
    });

    it('convierte un precio string con decimales del backend a number', () => {
      let precio: number | undefined;

      repository.getActivePrice(5, 2).subscribe((price) => (precio = price?.precioVenta));

      httpMock.expectOne((r) => r.url === `${endpoint}/activo/`).flush({ ...priceDto, precio_venta: '1999.99' });
      expect(precio).toBe(1999.99);
    });

    it('mapea un precio "0.00" a 0', () => {
      let precio: number | undefined;

      repository.getActivePrice(5, 2).subscribe((price) => (precio = price?.precioVenta));

      httpMock.expectOne((r) => r.url === `${endpoint}/activo/`).flush({ ...priceDto, precio_venta: '0.00' });
      expect(precio).toBe(0);
    });

    it('propaga el 404 del backend cuando no hay precio activo (no devuelve null)', () => {
      let error: HttpErrorResponse | undefined;

      repository.getActivePrice(5, 2).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === `${endpoint}/activo/`)
        .flush({ error: 'Precio no encontrado' }, { status: 404, statusText: 'Not Found' });
      expect(error?.status).toBe(404);
      expect(error?.error).toEqual({ error: 'Precio no encontrado' });
    });

    it('propaga un error 500', () => {
      let error: HttpErrorResponse | undefined;

      repository.getActivePrice(5, 2).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === `${endpoint}/activo/`)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      expect(error?.status).toBe(500);
    });
  });

  describe('getPriceHistory', () => {
    beforeEach(() => setup());

    const historyDto = (overrides: Partial<PriceHistoryResponseDto> = {}): PriceHistoryResponseDto => ({
      id: 1,
      id_producto: 5,
      id_sucursal: 2,
      precio_venta: '8.00',
      vigente_desde: '2026-01-01T00:00:00-06:00',
      activo: false,
      ...overrides,
    });

    it('hace GET a /precios-sucursal/historial/ con los parámetros y mapea cada ítem', () => {
      let result: unknown;

      repository.getPriceHistory(5, 2).subscribe((items) => (result = items));

      const req = httpMock.expectOne((r) => r.url === `${endpoint}/historial/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('id_producto')).toBe('5');
      expect(req.request.params.get('id_sucursal')).toBe('2');
      req.flush([historyDto({ id: 1, precio_venta: '8.00' }), historyDto({ id: 2, precio_venta: '10.99', activo: true })]);
      expect(result).toEqual([
        expect.objectContaining({ id: 1, precioVenta: 8, activo: false }),
        expect.objectContaining({ id: 2, precioVenta: 10.99, activo: true }),
      ]);
    });

    it('devuelve lista vacía si el producto no tiene historial', () => {
      let result: unknown;

      repository.getPriceHistory(5, 2).subscribe((items) => (result = items));

      httpMock.expectOne((r) => r.url === `${endpoint}/historial/`).flush([]);
      expect(result).toEqual([]);
    });

    it('propaga el error 400 del backend', () => {
      let error: HttpErrorResponse | undefined;

      repository.getPriceHistory(5, 2).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((r) => r.url === `${endpoint}/historial/`)
        .flush({ error: 'Debe enviar id_sucursal' }, { status: 400, statusText: 'Bad Request' });
      expect(error?.status).toBe(400);
    });
  });

  describe('setBranchPrice', () => {
    beforeEach(() => setup());

    it('hace POST a /precios-sucursal con el cuerpo snake_case y el precio como number', () => {
      let result: unknown;

      repository
        .setBranchPrice({ idProducto: 5, idSucursal: 2, precioVenta: 12.5 })
        .subscribe((price) => (result = price));

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id_producto: 5, id_sucursal: 2, precio_venta: 12.5 });
      expect(typeof req.request.body.precio_venta).toBe('number');
      req.flush(priceDto, { status: 201, statusText: 'Created' });
      expect(result).toEqual(expect.objectContaining({ id: 11, precioVenta: 12.5, activo: true }));
    });

    it('envía el precio con más de 2 decimales sin redondearlo (el backend decide)', () => {
      repository.setBranchPrice({ idProducto: 5, idSucursal: 2, precioVenta: 10.999 }).subscribe();

      const req = httpMock.expectOne(endpoint);
      expect(req.request.body.precio_venta).toBe(10.999);
      req.flush({ ...priceDto, precio_venta: '11.00' });
    });

    it('propaga el 400 del backend (precio inválido) con su mensaje', () => {
      let error: HttpErrorResponse | undefined;

      repository.setBranchPrice({ idProducto: 5, idSucursal: 2, precioVenta: 0 }).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne(endpoint)
        .flush({ error: 'precio_venta debe ser mayor a 0' }, { status: 400, statusText: 'Bad Request' });
      expect(error?.status).toBe(400);
      expect(error?.error.error).toBe('precio_venta debe ser mayor a 0');
    });

    it('propaga el 403 cuando el usuario no puede escribir precios de esa sucursal', () => {
      let error: HttpErrorResponse | undefined;

      repository.setBranchPrice({ idProducto: 5, idSucursal: 9, precioVenta: 5 }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(endpoint).flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
      expect(error?.status).toBe(403);
    });
  });

  describe('deactivatePrice', () => {
    beforeEach(() => setup());

    it('hace PUT {activo:false} a /precios-sucursal/{id} (no borra el historial, H-44)', () => {
      let completed = false;

      repository.deactivatePrice(9).subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne(`${endpoint}/9`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ activo: false });
      req.flush(priceDto);
      expect(completed).toBe(true);
    });

    it('propaga el 404 si el precio no existe', () => {
      let error: HttpErrorResponse | undefined;

      repository.deactivatePrice(999).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${endpoint}/999`).flush({ error: 'no existe' }, { status: 404, statusText: 'Not Found' });
      expect(error?.status).toBe(404);
    });
  });

  // Contrato backend (inventario/urls.py): todas las rutas de precios-sucursal terminan en "/".
  describe('con trailingSlashInterceptor (contrato de URLs del backend)', () => {
    beforeEach(() => setup(true));

    it('POST llega a /precios-sucursal/', () => {
      repository.setBranchPrice({ idProducto: 5, idSucursal: 2, precioVenta: 1 }).subscribe();

      httpMock.expectOne(`${endpoint}/`).flush(priceDto);
    });

    it('PUT de desactivar llega a /precios-sucursal/{id}/', () => {
      repository.deactivatePrice(9).subscribe();

      httpMock.expectOne(`${endpoint}/9/`).flush(priceDto);
    });

    it('GET activo conserva la ruta con slash y los query params', () => {
      repository.getActivePrice(5, 2).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${endpoint}/activo/`);
      expect(req.request.urlWithParams).toBe(`${endpoint}/activo/?id_producto=5&id_sucursal=2`);
      req.flush(priceDto);
    });
  });
});
