import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
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
import { GetSaleTicketUseCase } from '@features/sales/application/usecase/get-sale-ticket.usecase';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-repository.impl';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetailRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-detail-repository.impl';
import { PaymentMethodRepository } from '@features/sales/domain/repository/payment-method-repository';
import { PaymentMethodRepositoryImpl } from '@features/sales/infrastructure/repositories/payment-method-repository.impl';

// Integración real: Facade -> 10 UseCases reales -> Repositorios reales -> HttpClient.
// Sin interceptores: pertenecen al nivel aplicación global y se cubren en los specs de página/auth.
describe('SalesFacade (integración)', () => {
  const API = environment.apiUrl;
  const VENTAS = `${API}/ventas/`;
  const METODOS = `${API}/metodopago`;
  let httpMock: HttpTestingController;
  let facade: SalesFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        SalesFacade,
        CreateSaleUseCase,
        CreateCompleteSaleUseCase,
        GetSalesUseCase,
        GetPaymentMethodsUseCase,
        GetSaleDetailUseCase,
        GetSaleDetailsUseCase,
        CreateSaleDetailUseCase,
        UpdateSaleDetailUseCase,
        DeleteSaleDetailUseCase,
        GetSaleTicketUseCase,
        { provide: SaleRepository, useClass: SaleRepositoryImpl },
        { provide: SaleDetailRepository, useClass: SaleDetailRepositoryImpl },
        { provide: PaymentMethodRepository, useClass: PaymentMethodRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(SalesFacade);
  });

  afterEach(() => httpMock.verify());

  // Verifica que loadSales pueble el signal con las ventas mapeadas desde el backend.
  it('loadSales puebla el estado con las ventas del backend', () => {
    facade.loadSales();
    expect(facade.isLoadingSales()).toBe(true);

    httpMock.expectOne(VENTAS).flush([
      { id: 1, id_usuario: 2, id_inventario: 1, id_metodo_pago: 3, total: '150.00', fecha: '2024-01-01' },
    ]);

    expect(facade.sales()).toHaveLength(1);
    expect(facade.sales()[0].id).toBe(1);
    expect(facade.sales()[0].total.value).toBe(150);
    expect(facade.isLoadingSales()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que un 500 con {"message"} deje el mensaje del backend en errorMessage y apague la carga.
  it('loadSales ante 500 expone el mensaje del backend y libera la carga', () => {
    facade.loadSales();

    httpMock.expectOne(VENTAS).flush({ message: 'Error interno del servidor.' }, { status: 500, statusText: 'Server Error' });

    expect(facade.sales()).toEqual([]);
    expect(facade.errorMessage()).toBe('Error interno del servidor.');
    expect(facade.isLoadingSales()).toBe(false);
  });

  // Verifica que loadPaymentMethods pueble los métodos de pago mapeados desde el backend.
  it('loadPaymentMethods puebla los métodos de pago del backend', () => {
    facade.loadPaymentMethods();

    httpMock.expectOne(METODOS).flush([
      { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' },
      { id: 2, tipo: 'TARJETA', descripcion: 'Tarjeta' },
    ]);

    expect(facade.paymentMethods()).toHaveLength(2);
    expect(facade.paymentMethods()[0]).toEqual({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });
    expect(facade.paymentMethodsLoading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que un 401 en métodos de pago exponga el mensaje del backend (menor 2 corregido).
  it('loadPaymentMethods ante 401 expone el mensaje del backend', () => {
    facade.loadPaymentMethods();

    httpMock.expectOne(METODOS).flush({ detail: 'Token inválido.' }, { status: 401, statusText: 'Unauthorized' });

    expect(facade.paymentMethods()).toEqual([]);
    expect(facade.errorMessage()).toBe('Token inválido.');
    expect(facade.paymentMethodsLoading()).toBe(false);
  });

  // Verifica el flujo de registro vía facade con el flag isCreatingSale activo durante la operación.
  it('createCompleteSale vía facade ejecuta el flujo HTTP y libera el flag', (done) => {
    let folio = -1;
    facade.createCompleteSale({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] }).subscribe({
      // finalize corre tras entregar next: el flag se verifica después de los flush (flujo síncrono).
      next: (result) => {
        folio = result.ticket?.folio ?? -1;
        expect(result.sale.id).toBe(50);
      },
      error: done.fail,
      complete: () => done(),
    });
    expect(facade.isCreatingSale()).toBe(true);

    httpMock.expectOne(VENTAS).flush({ id: 50, id_usuario: 1, id_inventario: 1, id_metodo_pago: 1, total: '100.00', fecha: '2024-01-01' });
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush({
      folio: 50, fecha: '2024-01-01T00:00:00Z', vendedor: 'v1', metodo_pago: 'EFECTIVO',
      sucursal: 'S1', productos: [], total: '116.00',
    });

    expect(folio).toBe(50);
    expect(facade.isCreatingSale()).toBe(false);
  });

  // H-29: la validación del use case (idMetodoPago requerido) llega por el observable, sin emitir HTTP.
  it('createSale sin método de pago emite el error por el observable sin tocar la red', async () => {
    await expect(firstValueFrom(facade.createSale({ idMetodoPago: 0 }))).rejects.toThrow('CreateSale: idMetodoPago requerido');
    expect(facade.isCreatingSale()).toBe(false);
    httpMock.expectNone(VENTAS);
  });

  // Verifica que un error de validación por campo ({"cantidad": [...]}) en un detalle llegue al suscriptor.
  it('error por línea del backend (400 atómico) llega al suscriptor de la venta', (done) => {
    let message = '';
    facade.createCompleteSale({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 99 }] }).subscribe({
      error: (err) => {
        message = err.message;
        done();
      },
    });

    httpMock.expectOne(VENTAS).flush(
      { error: 'Errores en detalles: Línea 0 (producto 10): stock insuficiente' },
      { status: 400, statusText: 'Bad Request' },
    );
    httpMock.expectNone(`${API}/detalleventa/`);

    expect(message).toBe('Errores en detalles: Línea 0 (producto 10): stock insuficiente');
    expect(facade.isCreatingSale()).toBe(false);
  });
});
