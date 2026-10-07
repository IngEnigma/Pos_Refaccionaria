import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { CreateCompleteSaleUseCase } from './create-complete-sale.usecase';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-repository.impl';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetailRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-detail-repository.impl';
import {
  SaleCreationError,
  SaleDetailMutationError,
  SaleFetchError,
  SaleTicketPendingError,
} from '@features/sales/domain/errors/sales.errors';

// Integración real: UseCase -> Repositorios reales -> HttpClient (falso transporte).
// Sin interceptores: pertenecen al nivel aplicación global y se cubren en los specs de página/auth.
// Sin dobles de colaboradores: todas las clases del flujo son las de producción.
describe('CreateCompleteSaleUseCase (integración)', () => {
  const API = environment.apiUrl;
  const VENTAS = `${API}/ventas/`;
  const DETALLE = `${API}/detalleventa/`;
  let httpMock: HttpTestingController;
  let useCase: CreateCompleteSaleUseCase;

  const saleDto = {
    id: 50,
    id_usuario: 1,
    id_inventario: 5,
    id_metodoPago: 1,
    total: '200.00',
    fecha: '2024-01-01',
  };

  const detailDto = (id: number, productId: number, cantidad: number) => ({
    id,
    id_producto: productId,
    id_venta: 50,
    subtotal: '100.00',
    cantidad,
  });

  const ticketDto = {
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedor1',
    metodo_pago: 'EFECTIVO',
    sucursal: 'Sucursal 1',
    productos: [{ nombre: 'Filtro', cantidad: 2, precio_unitario: '100.00', subtotal: '200.00' }],
    total: '232.00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        CreateCompleteSaleUseCase,
        { provide: SaleRepository, useClass: SaleRepositoryImpl },
        { provide: SaleDetailRepository, useClass: SaleDetailRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    useCase = TestBed.inject(CreateCompleteSaleUseCase);
  });

  afterEach(() => httpMock.verify());

  // Verifica el flujo completo real: POST venta -> POST detalles -> GET ticket, con cuerpos y mapeo correctos.
  it('registra una venta válida de extremo a extremo del flujo', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      next: (result) => {
        expect(result.sale.id).toBe(50);
        expect(result.sale.total.value).toBe(200);
        expect(result.ticket.folio).toBe(50);
        expect(result.ticket.productos).toHaveLength(1);
        expect(result.ticket.total).toBe('232.00');
        done();
      },
      error: done.fail,
    });

    const saleReq = httpMock.expectOne(VENTAS);
    expect(saleReq.request.method).toBe('POST');
    expect(saleReq.request.body).toEqual({ id_metodoPago: 1 });
    saleReq.flush(saleDto);

    const detailReq = httpMock.expectOne(DETALLE);
    expect(detailReq.request.method).toBe('POST');
    expect(detailReq.request.body).toEqual({ id_producto: 10, id_venta: 50, cantidad: 2 });
    detailReq.flush(detailDto(11, 10, 2));

    const ticketReq = httpMock.expectOne(`${API}/ventas/50/ticket/`);
    expect(ticketReq.request.method).toBe('GET');
    ticketReq.flush(ticketDto);
  });

  // Verifica que cada producto del carrito genere su propio POST a detalleventa con su cantidad.
  it('envía un detalle por producto con su cantidad correspondiente', (done) => {
    useCase
      .execute({ idMetodoPago: 2, productos: [{ id: 10, cantidad: 1 }, { id: 20, cantidad: 3 }] })
      .subscribe({ next: () => done(), error: done.fail });

    httpMock.expectOne(VENTAS).flush(saleDto);

    // forkJoin dispara ambos POST en paralelo: se recuperan juntos y se verifica cada cuerpo.
    const details = httpMock.match(DETALLE);
    expect(details).toHaveLength(2);
    expect(details.map((r) => r.request.body)).toEqual([
      { id_producto: 10, id_venta: 50, cantidad: 1 },
      { id_producto: 20, id_venta: 50, cantidad: 3 },
    ]);
    details[0].flush(detailDto(11, 10, 1));
    details[1].flush(detailDto(12, 20, 3));

    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);
  });

  // Verifica que un payload sin productos se rechace sin emitir ninguna petición HTTP.
  it('rechaza la venta sin productos sin tocar la red', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [] }).subscribe({
      error: (err) => {
        expect(err.message).toBe('CreateCompleteSale: at least one product is required');
        done();
      },
    });
    httpMock.expectNone(VENTAS);
  });

  // Verifica que una cantidad inválida aborte el flujo antes de cualquier petición HTTP.
  it('rechaza cantidad cero sin tocar la red', () => {
    expect(() =>
      useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 0 }] }),
    ).toThrow('CreateCompleteSale.productos.cantidad: quantity must be greater than zero');
    httpMock.expectNone(VENTAS);
  });

  // Verifica que un 400 con {"error"} del backend llegue como SaleCreationError con ese mensaje.
  it('propaga el error 400 del backend al crear la venta', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleCreationError);
        expect(err.message).toBe('Stock insuficiente para el producto 10.');
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush({ error: 'Stock insuficiente para el producto 10.' }, { status: 400, statusText: 'Bad Request' });
    httpMock.expectNone(DETALLE);
  });

  // Verifica que un 500 al crear un detalle dispare rollback (DELETE venta) y propague el error del detalle.
  it('ante fallo del detalle hace rollback de la venta y propaga el error', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleDetailMutationError);
        expect(err.message).toBe('Error interno');
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush({ message: 'Error interno' }, { status: 500, statusText: 'Server Error' });

    const rollback = httpMock.expectOne(`${API}/ventas/50/`);
    expect(rollback.request.method).toBe('DELETE');
    rollback.flush(null);
  });

  // Verifica que si el rollback también falla, se propague el error original del detalle.
  it('si el rollback falla se propaga el error original del detalle', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleDetailMutationError);
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush('Fallo', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(`${API}/ventas/50/`).flush('Fallo rollback', { status: 500, statusText: 'Server Error' });
  });

  // Verifica que un error de red (status 0) al crear la venta se convierta en SaleCreationError.
  it('convierte el error de red al crear la venta en SaleCreationError', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleCreationError);
        done();
      },
    });

    httpMock.expectOne(VENTAS).error(new ProgressEvent('error'));
  });

  // Verifica el caso contemplado de respuesta inesperada: objeto sin id/total construye la venta desde el payload.
  it('tolera una respuesta de venta sin id ni total construyendo desde el payload', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      next: (result) => {
        expect(result.sale.id).toBe(0);
        expect(result.sale.total.value).toBe(0);
        done();
      },
      error: done.fail,
    });

    httpMock.expectOne(VENTAS).flush({});
    httpMock.expectOne(DETALLE).flush(detailDto(11, 10, 2));
    httpMock.expectOne(`${API}/ventas/0/ticket/`).flush({ ...ticketDto, folio: 0 });
  });

  // Verifica el Caso C (BUG2): ticket 404 tras venta+detalles OK llega como SaleTicketPendingError con saleId y causa.
  it('ticket 404 tras venta OK llega como SaleTicketPendingError con saleId', (done) => {
    // Conducta anterior: SaleFetchError sin saleId. Conducta nueva aprobada: error tipado con el ID.
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(SaleTicketPendingError);
        expect(err.saleId).toBe(50);
        expect(err.message).toBe('Venta no encontrada.');
        expect(err.cause).toBeInstanceOf(SaleFetchError);
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush(detailDto(11, 10, 2));
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush({ detail: 'Venta no encontrada.' }, { status: 404, statusText: 'Not Found' });
    httpMock.expectNone(DETALLE);
  });

  // Verifica el Caso G (BUG2): con sale.id 0 no se genera pendiente, se propaga el error genérico.
  it('ticket fallido con sale.id 0 no genera SaleTicketPendingError', (done) => {
    useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 2 }] }).subscribe({
      error: (err) => {
        expect(err).not.toBeInstanceOf(SaleTicketPendingError);
        expect(err).toBeInstanceOf(SaleFetchError);
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush({});
    httpMock.expectOne(DETALLE).flush(detailDto(11, 10, 2));
    httpMock.expectOne(`${API}/ventas/0/ticket/`).flush({ detail: 'No hay ticket.' }, { status: 404, statusText: 'Not Found' });
  });
});
