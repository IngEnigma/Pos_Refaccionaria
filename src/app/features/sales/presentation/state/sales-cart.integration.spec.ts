import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { SalesCartService } from './sales-cart.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
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
import { SalesProduct } from '../models/sales-ui.models';
import { Client } from '@features/clients/domain/entities/client.entity';

/**
 * INT-06: carrito (total, IVA, líneas) -> SalesCartService.confirmSale -> SalesFacade -> use cases -> repos -> HTTP.
 * Verifica que lo que se muestra al cajero y lo que viaja al backend sean coherentes.
 */
describe('INT-06 carrito vs payload enviado al backend', () => {
  const API = environment.apiUrl;
  const VENTAS = `${API}/ventas/`;
  let httpMock: HttpTestingController;
  let cart: SalesCartService;

  const product = (id: number, precio: number, stock = 10): SalesProduct => ({
    id,
    nombre: `Producto ${id}`,
    descripcion: '',
    precio,
    stock,
    codigoBarras: `00${id}`,
    imagen: '',
    hasSucursalPrice: true,
  });
  const EFECTIVO = { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        SalesCartService,
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
    cart = TestBed.inject(SalesCartService);
  });

  afterEach(() => httpMock.verify());

  describe('totales del carrito', () => {
    it('total = suma de líneas; subtotal e IVA 16 % se desglosan como incluidos', () => {
      cart.addToCart(product(1, 33.33));
      cart.increaseQty(cart.cart()[0]);
      cart.increaseQty(cart.cart()[0]);

      expect(cart.total()).toBe(99.99);
      expect(cart.subtotal()).toBe(86.2);
      expect(cart.iva()).toBe(13.79);
    });

    it('suma varias líneas y subtotal + IVA siempre es el total', () => {
      cart.addToCart(product(1, 100.5));
      cart.increaseQty(cart.cart()[0]);
      cart.addToCart(product(2, 49.99));

      expect(cart.total()).toBe(250.99);
      expect(cart.subtotal()).toBe(216.37);
      expect(cart.iva()).toBe(34.62);
      expect(+(cart.subtotal() + cart.iva()).toFixed(2)).toBe(cart.total());
    });

    it('agregar el mismo producto varias veces deja una sola línea y no supera el stock', () => {
      const p = product(1, 10, 2);
      cart.addToCart(p);
      cart.addToCart(p);
      cart.addToCart(p);

      expect(cart.cart()).toHaveLength(1);
      expect(cart.cart()[0].qty).toBe(2);
    });
  });

  describe('payload de la venta', () => {
    it('envía exactamente las líneas del carrito (id y cantidad) y ningún precio, IVA ni total', async () => {
      cart.addToCart(product(1, 100.5));
      cart.increaseQty(cart.cart()[0]);
      cart.addToCart(product(2, 49.99));
      cart.selectPayment(EFECTIVO);

      const done = firstValueFrom(cart.confirmSale());
      const req = httpMock.expectOne(VENTAS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        id_metodo_pago: 1,
        detalles: [
          { id_producto: 1, cantidad: 2 },
          { id_producto: 2, cantidad: 1 },
        ],
      });
      for (const key of ['total', 'subtotal', 'iva', 'descuento', 'precio']) {
        expect(req.request.body).not.toHaveProperty(key);
      }
      // H-40: el precio ya incluye IVA; el total del carrito es el que calcula y guarda el backend.
      expect(cart.total()).toBe(250.99);
      req.flush({ id: 70, id_usuario: 1, id_metodo_pago: 1, total: '250.99', fecha: '2024-01-01T00:00:00Z' });
      httpMock.expectOne(`${API}/ventas/70/ticket/`).flush({
        folio: 70, fecha: '2024-01-01T00:00:00Z', vendedor: 'v', metodo_pago: 'EFECTIVO', sucursal: 'S1',
        productos: [], total: '250.99',
      });

      const result = await done;
      expect(result.sale.id).toBe(70);
      // Tras vender se vacía el carrito y se recarga el historial de ventas.
      expect(cart.cart()).toEqual([]);
      expect(cart.selectedPayment()).toBeNull();
      httpMock.expectOne({ method: 'GET', url: VENTAS }).flush([]);
    });

    it('con cliente registrado envía id_cliente; Público general no lo envía', async () => {
      cart.addToCart(product(1, 10));
      cart.selectPayment(EFECTIVO);
      cart.selectClient({ id: 25 } as Client);

      const first = firstValueFrom(cart.confirmSale()).catch(() => null);
      const withClient = httpMock.expectOne(VENTAS);
      expect(withClient.request.body.id_cliente).toBe(25);
      withClient.flush({ error: 'x' }, { status: 400, statusText: 'Bad Request' });
      await first;

      cart.selectClient(null);
      const second = firstValueFrom(cart.confirmSale()).catch(() => null);
      const publico = httpMock.expectOne(VENTAS);
      expect(publico.request.body).not.toHaveProperty('id_cliente');
      publico.flush({ error: 'x' }, { status: 400, statusText: 'Bad Request' });
      await second;
    });

    it('si el backend rechaza la venta (400) el carrito y el método de pago se conservan', async () => {
      cart.addToCart(product(1, 10));
      cart.selectPayment(EFECTIVO);

      const done = firstValueFrom(cart.confirmSale()).catch((e: Error) => e);
      httpMock
        .expectOne(VENTAS)
        .flush({ error: 'Errores en detalles: Línea 0 (producto 1): stock insuficiente' }, { status: 400, statusText: 'Bad Request' });

      expect((await done as Error).message).toContain('stock insuficiente');
      expect(cart.cart()).toHaveLength(1);
      expect(cart.selectedPayment()).toEqual(EFECTIVO);
    });

    it('carrito vacío o sin método de pago no toca la red', async () => {
      await expect(firstValueFrom(cart.confirmSale())).rejects.toThrow('El carrito está vacío.');

      cart.addToCart(product(1, 10));
      await expect(firstValueFrom(cart.confirmSale())).rejects.toThrow('Selecciona un método de pago.');
      httpMock.expectNone(VENTAS);
    });
  });
});
