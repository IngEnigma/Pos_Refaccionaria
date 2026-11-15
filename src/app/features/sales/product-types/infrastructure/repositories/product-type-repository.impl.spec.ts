import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import {
  ProductTypeFetchError,
  ProductTypeMutationError,
} from '@features/sales/product-types/domain/errors/product-types.errors';
import { ProductTypeRepositoryImpl } from './product-type-repository.impl';

const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };

describe('ProductTypeRepositoryImpl', () => {
  const URL = `${envStub.apiUrl}${SALE_ENDPOINTS.CATEGORIES}`;
  let repository: ProductTypeRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductTypeRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });

    repository = TestBed.inject(ProductTypeRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getProductTypes', () => {
    // GET al endpoint de tipos y mapeo de cada DTO.
    it('obtiene los tipos de producto por GET y los mapea', () => {
      let result: unknown;
      repository.getProductTypes().subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 1, nombre: 'Frenos' },
        { id: 2, nombre: 'Filtros' },
      ]);

      expect(result).toEqual([
        { id: 1, nombre: 'Frenos' },
        { id: 2, nombre: 'Filtros' },
      ]);
    });

    // Lista vacía válida.
    it('devuelve lista vacía cuando no hay tipos', () => {
      let result: unknown;
      repository.getProductTypes().subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush([]);

      expect(result).toEqual([]);
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en ProductTypeFetchError conservando la causa', () => {
      let error: ProductTypeFetchError | undefined;
      repository.getProductTypes().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ detail: 'x' }, { status: 500, statusText: 'Server Error' });

      expect(error).toBeInstanceOf(ProductTypeFetchError);
      expect(error?.message).toBe('Failed to fetch product types');
      expect((error?.cause as { status: number }).status).toBe(500);
    });

    // Respuesta que no es un arreglo: el fallo de mapeo no escapa como TypeError crudo.
    it('convierte una respuesta que no es un arreglo en ProductTypeFetchError', () => {
      let error: unknown;
      repository.getProductTypes().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ id: 1 });

      expect(error).toBeInstanceOf(ProductTypeFetchError);
    });
  });

  describe('createProductType', () => {
    // POST con cuerpo mapeado y respuesta mapeada.
    it('crea por POST y mapea la respuesta del backend', () => {
      let result: unknown;
      repository.createProductType({ nombre: 'Frenos' }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ nombre: 'Frenos' });
      req.flush({ id: 4, nombre: 'Frenos' });

      expect(result).toEqual({ id: 4, nombre: 'Frenos' });
    });

    // Respuesta vacía: se reconstruye desde el payload con id 0.
    it.each([[null], [{}]])('reconstruye desde el payload cuando la respuesta es %p', (body) => {
      let result: unknown;
      repository.createProductType({ nombre: 'Frenos' }).subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush(body);

      expect(result).toEqual({ id: 0, nombre: 'Frenos' });
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en ProductTypeMutationError conservando la causa', () => {
      let error: ProductTypeMutationError | undefined;
      repository.createProductType({ nombre: 'Frenos' }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ error: 'Duplicado' }, { status: 400, statusText: 'Bad Request' });

      expect(error).toBeInstanceOf(ProductTypeMutationError);
      expect(error?.message).toBe('Duplicado');
      expect((error?.cause as { status: number }).status).toBe(400);
    });
  });

  describe('updateProductType', () => {
    // PUT al recurso y respuesta mapeada.
    it('actualiza por PUT y mapea la respuesta del backend', () => {
      let result: unknown;
      repository.updateProductType(4, { nombre: 'Clutch' }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}/4`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nombre: 'Clutch' });
      req.flush({ id: 4, nombre: 'Clutch' });

      expect(result).toEqual({ id: 4, nombre: 'Clutch' });
    });

    // Respuesta vacía: conserva el id de la URL y el nombre del payload.
    it('reconstruye con el id de la URL y el payload cuando la respuesta viene vacía', () => {
      let result: unknown;
      repository.updateProductType(4, { nombre: 'Clutch' }).subscribe((r) => (result = r));

      httpMock.expectOne(`${URL}/4`).flush(null);

      expect(result).toEqual({ id: 4, nombre: 'Clutch' });
    });

    // Payload sin nombre y respuesta vacía: nombre cae a cadena vacía.
    it('usa cadena vacía como nombre cuando ni payload ni respuesta lo traen', () => {
      let result: unknown;
      repository.updateProductType(4, {}).subscribe((r) => (result = r));

      httpMock.expectOne(`${URL}/4`).flush(null);

      expect(result).toEqual({ id: 4, nombre: '' });
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en ProductTypeMutationError', () => {
      let error: ProductTypeMutationError | undefined;
      repository.updateProductType(4, { nombre: 'X' }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}/4`).flush({ detail: 'No encontrado' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(ProductTypeMutationError);
      expect(error?.message).toBe('No encontrado');
    });
  });

  describe('deleteProductType', () => {
    // DELETE exitoso devuelve true.
    it('elimina por DELETE y devuelve true', () => {
      let result: unknown;
      repository.deleteProductType(4).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}/4`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(result).toBe(true);
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en ProductTypeMutationError', () => {
      let error: ProductTypeMutationError | undefined;
      repository.deleteProductType(4).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}/4`).flush({ error: 'En uso por ventas' }, { status: 409, statusText: 'Conflict' });

      expect(error).toBeInstanceOf(ProductTypeMutationError);
      expect(error?.message).toBe('En uso por ventas');
      expect((error?.cause as { status: number }).status).toBe(409);
    });
  });
});
