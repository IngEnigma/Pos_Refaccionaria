import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { Environment } from '@env/environment.model';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import {
  SaleDetailFetchError,
  SaleDetailMutationError,
} from '@features/sales/domain/errors/sales.errors';
import { SaleDetailRepositoryImpl } from './sale-detail-repository.impl';

const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };

describe('SaleDetailRepositoryImpl', () => {
  const URL = `${envStub.apiUrl}${SALE_ENDPOINTS.DETAIL}`;
  let repository: SaleDetailRepositoryImpl;
  let httpMock: HttpTestingController;
  let logger: jest.Mocked<LoggerPort>;

  const dto = (id: number, productId: number, cantidad: number, subtotal = '100.00') => ({
    id,
    id_producto: productId,
    id_venta: 50,
    subtotal,
    cantidad,
  });

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        SaleDetailRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
        { provide: LOGGER_PORT, useValue: logger },
      ],
    });

    repository = TestBed.inject(SaleDetailRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getSaleDetails', () => {
    // GET al endpoint de detalle y mapeo (subtotal texto -> número, snake_case -> camelCase).
    it('obtiene los detalles por GET y los mapea', () => {
      let result: unknown;
      repository.getSaleDetails().subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('GET');
      req.flush([dto(1, 10, 2, '250.50')]);

      expect(result).toEqual([{ id: 1, productId: 10, saleId: 50, subtotal: 250.5, cantidad: 2 }]);
    });

    // Error HTTP: mensaje del backend, causa y log.
    it('convierte un error HTTP en SaleDetailFetchError con el mensaje del backend y lo registra', () => {
      let error: SaleDetailFetchError | undefined;
      repository.getSaleDetails().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ detail: 'Sin permiso' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(SaleDetailFetchError);
      expect(error?.message).toBe('Sin permiso');
      expect((error?.cause as { status: number }).status).toBe(403);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch sale details',
        expect.objectContaining({ url: URL }),
      );
    });

    // DTO inválido (subtotal negativo): el fallo del mapeo se envuelve en SaleDetailFetchError.
    it('convierte un DTO con subtotal negativo en SaleDetailFetchError', () => {
      let error: SaleDetailFetchError | undefined;
      repository.getSaleDetails().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush([dto(1, 10, 2, '-5')]);

      expect(error).toBeInstanceOf(SaleDetailFetchError);
      expect(error?.message).toBe('SaleDetail.subtotal: money must be a non-negative number');
    });
  });

  describe('createSaleDetail', () => {
    // POST con cuerpo en snake_case y respuesta mapeada.
    it('crea por POST con el cuerpo mapeado y mapea la respuesta', () => {
      let result: unknown;
      repository.createSaleDetail({ productId: 10, saleId: 50, cantidad: 2 }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id_producto: 10, id_venta: 50, cantidad: 2 });
      req.flush(dto(11, 10, 2));

      expect(result).toEqual({ id: 11, productId: 10, saleId: 50, subtotal: 100, cantidad: 2 });
    });

    // Respuesta vacía: detalle reconstruido desde el payload (id 0, subtotal 0).
    it.each([[null], [{}]])('reconstruye desde el payload cuando la respuesta es %p', (body) => {
      let result: unknown;
      repository.createSaleDetail({ productId: 10, saleId: 50, cantidad: 2 }).subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush(body);

      expect(result).toEqual({ id: 0, productId: 10, saleId: 50, subtotal: 0, cantidad: 2 });
    });

    // H-28: si la respuesta trae el id pero no el subtotal, se conserva el id real.
    it('H-28: conserva el id real cuando la respuesta no trae subtotal', () => {
      let result: unknown;
      repository.createSaleDetail({ productId: 10, saleId: 50, cantidad: 2 }).subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush({ id: 3 });

      expect(result).toEqual({ id: 3, productId: 10, saleId: 50, subtotal: 0, cantidad: 2 });
    });

    // Error 400 con mensaje del backend (p. ej. stock insuficiente): llega al usuario y se registra.
    it('convierte un 400 en SaleDetailMutationError con el mensaje del backend y lo registra', () => {
      let error: SaleDetailMutationError | undefined;
      repository
        .createSaleDetail({ productId: 10, saleId: 50, cantidad: 99 })
        .subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne(URL)
        .flush({ error: 'Stock insuficiente' }, { status: 400, statusText: 'Bad Request' });

      expect(error).toBeInstanceOf(SaleDetailMutationError);
      expect(error?.message).toBe('Stock insuficiente');
      expect((error?.cause as { status: number }).status).toBe(400);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create sale detail',
        expect.objectContaining({ url: URL }),
      );
    });

    // Sin cuerpo útil en el error: se usa el mensaje de HttpErrorResponse (no el fallback).
    it('usa el mensaje de HttpErrorResponse cuando el error no trae cuerpo', () => {
      let error: SaleDetailMutationError | undefined;
      repository
        .createSaleDetail({ productId: 10, saleId: 50, cantidad: 1 })
        .subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush(null, { status: 500, statusText: 'Server Error' });

      expect(error).toBeInstanceOf(SaleDetailMutationError);
      expect(error?.message).toContain('500');
    });

    // Error de red.
    it('convierte un error de red en SaleDetailMutationError', () => {
      let error: unknown;
      repository
        .createSaleDetail({ productId: 10, saleId: 50, cantidad: 1 })
        .subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).error(new ProgressEvent('error'));

      expect(error).toBeInstanceOf(SaleDetailMutationError);
    });
  });

  describe('updateSaleDetail', () => {
    // PUT al recurso con barra final y solo los campos definidos.
    it('actualiza por PUT enviando solo los campos definidos y mapea la respuesta', () => {
      let result: unknown;
      repository.updateSaleDetail(11, { cantidad: 5 }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}11/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ cantidad: 5 });
      req.flush(dto(11, 10, 5, '500.00'));

      expect(result).toEqual({ id: 11, productId: 10, saleId: 50, subtotal: 500, cantidad: 5 });
    });

    // Respuesta vacía: conserva el id de la URL y usa cantidad 1 si el payload no la trae.
    it('reconstruye con el id de la URL y cantidad 1 por defecto cuando la respuesta viene vacía', () => {
      let result: unknown;
      repository.updateSaleDetail(11, {}).subscribe((r) => (result = r));

      httpMock.expectOne(`${URL}11/`).flush(null);

      expect(result).toEqual({ id: 11, productId: 0, saleId: 0, subtotal: 0, cantidad: 1 });
    });

    // Error: mensaje del backend, causa y log con el id.
    it('convierte un error HTTP en SaleDetailMutationError y lo registra con el id', () => {
      let error: SaleDetailMutationError | undefined;
      repository.updateSaleDetail(11, { cantidad: 5 }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}11/`).flush({ message: 'No existe' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(SaleDetailMutationError);
      expect(error?.message).toBe('No existe');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to update sale detail',
        expect.objectContaining({ id: 11 }),
      );
    });
  });

  describe('deleteSaleDetail', () => {
    // DELETE exitoso devuelve true.
    it('elimina por DELETE y devuelve true', () => {
      let result: unknown;
      repository.deleteSaleDetail(11).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}11/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(result).toBe(true);
    });

    // Error: mensaje del backend, causa y log con el id.
    it('convierte un error HTTP en SaleDetailMutationError y lo registra con el id', () => {
      let error: SaleDetailMutationError | undefined;
      repository.deleteSaleDetail(11).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}11/`).flush({ detail: 'Prohibido' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(SaleDetailMutationError);
      expect(error?.message).toBe('Prohibido');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to delete sale detail',
        expect.objectContaining({ id: 11 }),
      );
    });
  });
});
