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
import { SaleCreationError } from '@features/sales/domain/errors/sales.errors';

/**
 * INT-05 (H-09 / H-38): contrato REAL del backend (RefaccionariaBack, rama Develop).
 * - `POST /ventas/` con `detalles` crea cabecera + líneas + salidas de stock en UNA transacción
 *   (`VentaService.crear_venta_completa`): si una línea falla no queda venta huérfana ni stock descontado.
 * - El campo se llama `id_metodo_pago` (migración ventas 0003); `id_metodo_pago` ya no existe.
 * - `DELETE /ventas/<id>/` exige `ventas.anular` (el cajero NO lo tiene) y solo cancela la venta
 *   (estado='cancelada', conserva detalles y repone stock): no sirve como rollback del cajero.
 */
describe('INT-05 venta completa atómica (UseCase -> repos reales -> HttpClient)', () => {
  const API = environment.apiUrl;
  const VENTAS = `${API}/ventas/`;
  let httpMock: HttpTestingController;
  let useCase: CreateCompleteSaleUseCase;

  const ventaDto = {
    id: 50,
    id_usuario: 1,
    id_metodo_pago: 2,
    id_sucursal: 3,
    id_cliente: null,
    estado: 'completada',
    total: '200.00',
    fecha: '2024-01-01T00:00:00Z',
    detalles: [
      { id: 11, id_producto: 10, cantidad: 1, subtotal: '100.00' },
      { id: 12, id_producto: 20, cantidad: 1, subtotal: '100.00' },
    ],
  };
  const ticketDto = {
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'cajero1',
    metodo_pago: 'EFECTIVO',
    sucursal: 'Sucursal 1',
    productos: [{ nombre: 'Filtro', cantidad: 1, precio_unitario: '100.00', subtotal: '100.00' }],
    total: '232.00',
  };
  const productos = [
    { id: 10, cantidad: 1 },
    { id: 20, cantidad: 1 },
  ];

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
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    useCase = TestBed.inject(CreateCompleteSaleUseCase);
  });

  afterEach(() => httpMock.verify());

  it('crea cabecera y detalles con una sola petición POST /ventas/ y luego pide el ticket', async () => {
    const result = new Promise<unknown>((resolve, reject) =>
      useCase.execute({ idMetodoPago: 2, idCliente: 25, productos }).subscribe({ next: resolve, error: reject }),
    );

    const req = httpMock.expectOne(VENTAS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_metodo_pago: 2,
      id_cliente: 25,
      detalles: [
        { id_producto: 10, cantidad: 1 },
        { id_producto: 20, cantidad: 1 },
      ],
    });
    req.flush(ventaDto);
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);

    const { sale, ticket } = (await result) as { sale: { id: number; idMetodoPago: number; total: { value: number } }; ticket: { folio: number } };
    expect(sale.id).toBe(50);
    expect(sale.idMetodoPago).toBe(2);
    expect(sale.total.value).toBe(200);
    expect(ticket.folio).toBe(50);
    httpMock.expectNone(`${API}/detalleventa/`);
  });

  it('Público general: omite id_cliente por completo (nunca null)', () => {
    useCase.execute({ idMetodoPago: 2, productos }).subscribe();

    const req = httpMock.expectOne(VENTAS);
    expect(req.request.body).not.toHaveProperty('id_cliente');
    expect(req.request.body).toHaveProperty('id_metodo_pago', 2);
    req.flush(ventaDto);
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);
  });

  it('si el backend rechaza una línea (400), no hay venta huérfana: no se llama a detalleventa ni a DELETE', async () => {
    const result = new Promise<unknown>((resolve) => useCase.execute({ idMetodoPago: 2, productos }).subscribe({ error: resolve }));

    httpMock.expectOne(VENTAS).flush(
      { error: 'Errores en detalles: Línea 1 (producto 20): stock insuficiente: disponible 0, solicitado 1' },
      { status: 400, statusText: 'Bad Request' },
    );

    const err = (await result) as Error;
    expect(err).toBeInstanceOf(SaleCreationError);
    expect(err.message).toContain('stock insuficiente');
    httpMock.expectNone(`${API}/detalleventa/`);
    httpMock.expectNone(`${API}/ventas/50/`);
  });

  it('un cajero sin permiso recibe el 403 del backend sin intentar anular ninguna venta', async () => {
    const result = new Promise<unknown>((resolve) => useCase.execute({ idMetodoPago: 2, productos }).subscribe({ error: resolve }));

    httpMock
      .expectOne(VENTAS)
      .flush({ detail: "Requiere permiso 'ventas.vender' (rol insuficiente)" }, { status: 403, statusText: 'Forbidden' });

    expect(await result).toBeInstanceOf(SaleCreationError);
    httpMock.expectNone(`${API}/detalleventa/`);
  });

  it('H-08: si el ticket falla después de crear la venta devuelve la venta sin ticket y no la anula', async () => {
    const result = new Promise<{ sale: { id: number }; ticket: unknown }>((resolve) =>
      useCase.execute({ idMetodoPago: 2, productos }).subscribe({ next: resolve as never }),
    );

    httpMock.expectOne(VENTAS).flush(ventaDto);
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush({}, { status: 500, statusText: 'Server Error' });

    const r = await result;
    expect(r.sale.id).toBe(50);
    expect(r.ticket).toBeNull();
    httpMock.expectNone(`${API}/ventas/50/`);
  });

  it('rechaza la venta sin productos sin tocar la red', async () => {
    const err = await new Promise<Error>((resolve) => useCase.execute({ idMetodoPago: 1, productos: [] }).subscribe({ error: resolve }));

    expect(err.message).toBe('CreateCompleteSale: at least one product is required');
    httpMock.expectNone(VENTAS);
  });

  it('rechaza cantidad cero sin tocar la red', () => {
    expect(() => useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 0 }] })).toThrow(
      'CreateCompleteSale.productos.cantidad: quantity must be greater than zero',
    );
    httpMock.expectNone(VENTAS);
  });

  it('convierte el error de red en SaleCreationError', async () => {
    const result = new Promise<unknown>((resolve) => useCase.execute({ idMetodoPago: 1, productos }).subscribe({ error: resolve }));

    httpMock.expectOne(VENTAS).error(new ProgressEvent('error'));

    expect(await result).toBeInstanceOf(SaleCreationError);
  });

  it('tolera una respuesta sin id ni total construyendo la venta desde el payload', async () => {
    const result = new Promise<{ sale: { id: number; total: { value: number } } }>((resolve) =>
      useCase.execute({ idMetodoPago: 1, productos }).subscribe({ next: resolve as never }),
    );

    httpMock.expectOne(VENTAS).flush({});
    httpMock.expectOne(`${API}/ventas/0/ticket/`).flush({ ...ticketDto, folio: 0 });

    const { sale } = await result;
    expect(sale.id).toBe(0);
    expect(sale.total.value).toBe(0);
  });
});
