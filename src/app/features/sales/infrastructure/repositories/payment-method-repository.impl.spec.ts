import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { SALE_ENDPOINTS } from '@features/sales/config/sale-endpoints';
import {
  PaymentMethodFetchError,
  PaymentMethodMutationError,
} from '@features/sales/domain/errors/sales.errors';
import { PaymentMethodRepositoryImpl } from './payment-method-repository.impl';

const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };

describe('PaymentMethodRepositoryImpl', () => {
  const URL = `${envStub.apiUrl}${SALE_ENDPOINTS.PAYMENT_METHODS}`;
  let repository: PaymentMethodRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentMethodRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });

    repository = TestBed.inject(PaymentMethodRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPaymentMethods', () => {
    // GET al endpoint de métodos de pago y mapeo de cada DTO.
    it('obtiene los métodos de pago por GET y los mapea', () => {
      let result: unknown;
      repository.getPaymentMethods().subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 1, tipo: 'EFECTIVO', descripcion: 'Pago en efectivo' },
        { id: 2, tipo: 'TARJETA', descripcion: 'Pago con tarjeta' },
      ]);

      expect(result).toEqual([
        { id: 1, tipo: 'EFECTIVO', descripcion: 'Pago en efectivo' },
        { id: 2, tipo: 'TARJETA', descripcion: 'Pago con tarjeta' },
      ]);
    });

    // Lista vacía válida.
    it('devuelve lista vacía cuando el backend no tiene métodos', () => {
      let result: unknown;
      repository.getPaymentMethods().subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush([]);

      expect(result).toEqual([]);
    });

    // El mensaje del backend se conserva y el error HTTP queda como cause.
    it('convierte un error HTTP en PaymentMethodFetchError con el mensaje del backend y la causa', () => {
      let error: PaymentMethodFetchError | undefined;
      repository.getPaymentMethods().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ detail: 'No autorizado' }, { status: 403, statusText: 'Forbidden' });

      expect(error).toBeInstanceOf(PaymentMethodFetchError);
      expect(error?.message).toBe('No autorizado');
      expect((error?.cause as { status: number }).status).toBe(403);
    });

    // Error de red (status 0) también se envuelve.
    it('convierte un error de red en PaymentMethodFetchError', () => {
      let error: unknown;
      repository.getPaymentMethods().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).error(new ProgressEvent('error'));

      expect(error).toBeInstanceOf(PaymentMethodFetchError);
    });

    // Respuesta que no es un arreglo: el fallo de mapeo no escapa como TypeError crudo.
    it('convierte una respuesta que no es un arreglo en PaymentMethodFetchError', () => {
      let error: unknown;
      repository.getPaymentMethods().subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ id: 1 });

      expect(error).toBeInstanceOf(PaymentMethodFetchError);
    });
  });

  describe('createPaymentMethod', () => {
    // POST con el cuerpo mapeado y respuesta del backend mapeada.
    it('crea por POST y mapea la respuesta del backend', () => {
      let result: unknown;
      repository.createPaymentMethod({ tipo: 'CHEQUE', descripcion: 'Pago con cheque' }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tipo: 'CHEQUE', descripcion: 'Pago con cheque' });
      req.flush({ id: 9, tipo: 'CHEQUE', descripcion: 'Pago con cheque' });

      expect(result).toEqual({ id: 9, tipo: 'CHEQUE', descripcion: 'Pago con cheque' });
    });

    // Respuesta vacía (p. ej. 201 sin cuerpo): se reconstruye desde el payload con id 0.
    it.each([[null], [{}]])('reconstruye desde el payload cuando la respuesta es %p', (body) => {
      let result: unknown;
      repository.createPaymentMethod({ tipo: 'CHEQUE', descripcion: 'Pago con cheque' }).subscribe((r) => (result = r));

      httpMock.expectOne(URL).flush(body);

      expect(result).toEqual({ id: 0, tipo: 'CHEQUE', descripcion: 'Pago con cheque' });
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en PaymentMethodMutationError conservando la causa', () => {
      let error: PaymentMethodMutationError | undefined;
      repository.createPaymentMethod({ tipo: 'X', descripcion: 'Y' }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(URL).flush({ error: 'Duplicado' }, { status: 400, statusText: 'Bad Request' });

      expect(error).toBeInstanceOf(PaymentMethodMutationError);
      expect(error?.message).toBe('Duplicado');
      expect((error?.cause as { status: number }).status).toBe(400);
    });
  });

  describe('updatePaymentMethod', () => {
    // PUT al recurso con solo los campos definidos.
    it('actualiza por PUT enviando solo los campos definidos y mapea la respuesta', () => {
      let result: unknown;
      repository.updatePaymentMethod(5, { descripcion: 'Nueva' }).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ descripcion: 'Nueva' });
      req.flush({ id: 5, tipo: 'TARJETA', descripcion: 'Nueva' });

      expect(result).toEqual({ id: 5, tipo: 'TARJETA', descripcion: 'Nueva' });
    });

    // Respuesta vacía: conserva el id de la URL y rellena con el payload (faltantes como cadena vacía).
    it('reconstruye con el id de la URL y el payload cuando la respuesta viene vacía', () => {
      let result: unknown;
      repository.updatePaymentMethod(5, { tipo: 'TARJETA' }).subscribe((r) => (result = r));

      httpMock.expectOne(`${URL}/5`).flush(null);

      expect(result).toEqual({ id: 5, tipo: 'TARJETA', descripcion: '' });
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en PaymentMethodMutationError', () => {
      let error: PaymentMethodMutationError | undefined;
      repository.updatePaymentMethod(5, { tipo: 'X' }).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}/5`).flush({ detail: 'No encontrado' }, { status: 404, statusText: 'Not Found' });

      expect(error).toBeInstanceOf(PaymentMethodMutationError);
      expect(error?.message).toBe('No encontrado');
    });
  });

  describe('deletePaymentMethod', () => {
    // DELETE exitoso devuelve true.
    it('elimina por DELETE y devuelve true', () => {
      let result: unknown;
      repository.deletePaymentMethod(5).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${URL}/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(result).toBe(true);
    });

    // H-27: el mensaje del backend se propaga y la causa original se conserva.
    it('convierte un error HTTP en PaymentMethodMutationError', () => {
      let error: PaymentMethodMutationError | undefined;
      repository.deletePaymentMethod(5).subscribe({ error: (e) => (error = e) });

      httpMock.expectOne(`${URL}/5`).flush({ error: 'En uso por ventas' }, { status: 409, statusText: 'Conflict' });

      expect(error).toBeInstanceOf(PaymentMethodMutationError);
      expect(error?.message).toBe('En uso por ventas');
      expect((error?.cause as { status: number }).status).toBe(409);
    });
  });
});
