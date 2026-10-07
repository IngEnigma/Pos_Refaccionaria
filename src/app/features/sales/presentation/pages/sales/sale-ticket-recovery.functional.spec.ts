import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BanknoteIcon, CreditCard, ArrowLeftRightIcon, LucideAngularModule, Package, Trash2 } from 'lucide-angular';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { STORAGE_PORT, PERSISTENT_STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { SEARCH_STRATEGY } from '@core/search/search.strategy';
import { DefaultSearchStrategy } from '@core/search/default-search.strategy';
import { GlobalSearchService } from '@core/search/global-search.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { authTokenInterceptor } from '@features/auth/infrastructure/http/auth-token.interceptor';
import { AuthTokenRefreshOrchestrator } from '@features/auth/application/services/auth-token-refresh-orchestrator.service';
import { RefreshTokenUseCase } from '@features/auth/application/usecase/refresh.usecase';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { GetMyProfileUseCase } from '@features/auth/application/usecases/get-my-profile.usecase';
import { UpdateMySucursalUseCase } from '@features/auth/application/usecases/update-my-sucursal.usecase';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { ProfileRepositoryImpl } from '@features/auth/infrastructure/repositories/profile-repository.impl';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { SalesPageComponent } from './sales.page';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { ProductTypesFacade } from '@features/sales/application/facades/product-types.facade';
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
import { GetProductTypesUseCase } from '@features/sales/product-types/application/usecase/get-product-types.usecase';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-repository.impl';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetailRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-detail-repository.impl';
import { PaymentMethodRepository } from '@features/sales/domain/repository/payment-method-repository';
import { PaymentMethodRepositoryImpl } from '@features/sales/infrastructure/repositories/payment-method-repository.impl';
import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductTypeRepositoryImpl } from '@features/sales/product-types/infrastructure/repositories/product-type-repository.impl';
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { GetMyBranchInventoryUseCase } from '@features/inventory-by-branch/application/usecase/get-my-branch-inventory.usecase';
import { GetMovementsUseCase } from '@features/inventory-by-branch/application/usecase/get-movements.usecase';
import { RegisterMovementUseCase } from '@features/inventory-by-branch/application/usecase/register-movement.usecase';
import { InventoryRepository } from '@features/inventory-by-branch/domain/repository/inventory-repository';
import { InventoryRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/inventory-repository.impl';
import { InventoryMovementRepository } from '@features/inventory-by-branch/domain/repository/movement-repository';
import { InventoryMovementRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/movement-repository.impl';

// Funcional BUG2: venta registrada con ticket pendiente y su recuperación GET-only.
// Todos los colaboradores son reales; solo el transporte HTTP es falso.
describe('Recuperación de ticket pendiente (funcional BUG2)', () => {
  const API = environment.apiUrl;
  const INV = `${API}/inventarios/mi-sucursal/`;
  const VENTAS = `${API}/ventas/`;
  const METODOS = `${API}/metodopago/`;
  const TIPOS = `${API}/tipos/`;
  const DETALLE = `${API}/detalleventa/`;

  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<SalesPageComponent>;
  let page: SalesPageComponent;
  let toasts: ToastService;

  const itemDto = {
    id: 1, id_producto: 101, nombre: 'Filtro de aceite', clave: 'FLT-1234', marca: 'ACME',
    codigo_barras: '7501234567890', precio_venta: '150.00', precio_sucursal: '120.00',
    precio_base: '100.00', costo: '80.00', cantidad: 5,
  };
  const inventoryDto = [{ id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles: [itemDto] }];
  const PAGO = { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' };
  const saleDto = { id: 70, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' };
  const detailDto = { id: 71, id_producto: 101, id_venta: 70, subtotal: '120.00', cantidad: 1 };
  const ticketDto = {
    folio: 70, fecha: '2024-01-01T00:00:00Z', vendedor: 'vendedora', metodo_pago: 'EFECTIVO',
    sucursal: 'Central',
    productos: [{ nombre: 'Filtro de aceite', cantidad: 1, precio_unitario: '120.00', subtotal: '120.00' }],
    total: '139.20',
  };

  beforeAll(() => {
    // Shims de entorno: jsdom no expone crypto.randomUUID ni IntersectionObserver.
    const g = globalThis as Record<string, unknown>;
    if (!g['crypto']) g['crypto'] = {};
    const c = g['crypto'] as Record<string, unknown>;
    if (typeof c['randomUUID'] !== 'function') c['randomUUID'] = () => `uuid-${Math.random()}`;
    if (typeof g['IntersectionObserver'] !== 'function') {
      g['IntersectionObserver'] = class {
        observe() { /* no-op */ }
        unobserve() { /* no-op */ }
        disconnect() { /* no-op */ }
      };
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor, authTokenInterceptor, trailingSlashInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ BanknoteIcon, CreditCard, ArrowLeftRightIcon, Package, Trash2 })),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: STORAGE_PORT, useClass: InMemoryStorageService },
        { provide: PERSISTENT_STORAGE_PORT, useClass: LocalStorageService },
        { provide: SEARCH_STRATEGY, useClass: DefaultSearchStrategy },
        GlobalSearchService,
        ToastService,
        SessionStateService,
        AuthFacade,
        LoginUseCase,
        GetMyProfileUseCase,
        UpdateMySucursalUseCase,
        { provide: AuthRepository, useClass: AuthRepositoryImpl },
        { provide: ProfileRepository, useClass: ProfileRepositoryImpl },
        AuthTokenRefreshOrchestrator,
        RefreshTokenUseCase,
        SalesFacade,
        ProductTypesFacade,
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
        GetProductTypesUseCase,
        { provide: SaleRepository, useClass: SaleRepositoryImpl },
        { provide: SaleDetailRepository, useClass: SaleDetailRepositoryImpl },
        { provide: PaymentMethodRepository, useClass: PaymentMethodRepositoryImpl },
        { provide: ProductTypeRepository, useClass: ProductTypeRepositoryImpl },
        InventoryByBranchFacade,
        GetMyBranchInventoryUseCase,
        GetMovementsUseCase,
        RegisterMovementUseCase,
        { provide: InventoryRepository, useClass: InventoryRepositoryImpl },
        { provide: InventoryMovementRepository, useClass: InventoryMovementRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    TestBed.inject(SessionStateService).setSucursalId(7);
    fixture = TestBed.createComponent(SalesPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(METODOS).forEach((r) => r.flush([]));
    httpMock.match(TIPOS).forEach((r) => r.flush([]));
  });

  afterEach(() => httpMock.verify());

  function lastToast() {
    const all = toasts.toasts();
    return all[all.length - 1];
  }

  // Lleva la página al estado pendiente: venta+detalle OK y ticket 404, con recargas atendidas.
  function driveToPending() {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);
    page.processTransaction();

    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush(detailDto);
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush({ detail: 'Ticket no disponible.' }, { status: 404, statusText: 'Not Found' });
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();
  }

  // Caso A (BUG2): verifica que si falla crear la venta no haya pendiente, el carrito siga y se pueda reintentar.
  it('Caso A: fallo al crear la venta conserva el carrito y permite reintentar', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush({ error: 'Fallo al crear.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(page.pendingTicketSaleId()).toBeNull();
    expect(page.cartItems()).toHaveLength(1);
    expect(lastToast().type).toBe('error');

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush(detailDto);
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.cartItems()).toHaveLength(0);
  });

  // Caso B (BUG2): verifica que si falla un detalle haya rollback, carrito intacto y reintento permitido.
  it('Caso B: fallo de detalle hace rollback y permite reintentar la venta completa', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush('Fallo detalle', { status: 500, statusText: 'Server Error' });
    const rollback = httpMock.expectOne(`${API}/ventas/70/`);
    expect(rollback.request.method).toBe('DELETE');
    rollback.flush(null);
    fixture.detectChanges();

    expect(page.pendingTicketSaleId()).toBeNull();
    expect(page.cartItems()).toHaveLength(1);

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush(detailDto);
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.cartItems()).toHaveLength(0);
  });

  // Caso D (BUG2): verifica que recuperar el ticket use solo GET y muestre el ticket sin crear otra venta.
  it('Caso D: recuperar el ticket usa solo GET y muestra el ticket', () => {
    driveToPending();
    expect(page.pendingTicketSaleId()).toBe(70);

    page.recoverPendingTicket();

    const retry = httpMock.expectOne(`${API}/ventas/70/ticket/`);
    expect(retry.request.method).toBe('GET');
    httpMock.expectNone((req) => req.method === 'POST');
    retry.flush(ticketDto);
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.pendingTicketSaleId()).toBeNull();
    expect(fixture.nativeElement.querySelector('.pending-ticket-banner')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ticket #70');
    httpMock.expectNone((req) => req.method === 'POST');
  });

  // Caso E (BUG2): verifica que si la recuperación falla, el pendiente siga y se pueda reintentar.
  it('Caso E: recuperación fallida conserva el pendiente y permite otro intento', () => {
    driveToPending();

    page.recoverPendingTicket();
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush('Sigue fallando', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(page.pendingTicketSaleId()).toBe(70);
    expect(page.isRecoveringTicket()).toBe(false);
    expect(lastToast().type).toBe('error');
    httpMock.expectNone((req) => req.method === 'POST');

    page.recoverPendingTicket();
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush(ticketDto);
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.pendingTicketSaleId()).toBeNull();
  });

  // Caso F (BUG2): verifica que el doble click en recuperar emita un solo GET.
  it('Caso F: doble reintento de ticket en vuelo emite un solo GET', () => {
    driveToPending();

    page.recoverPendingTicket();
    page.recoverPendingTicket();

    const retries = httpMock.match(`${API}/ventas/70/ticket/`);
    expect(retries).toHaveLength(1);
    retries[0].flush(ticketDto);
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.pendingTicketSaleId()).toBeNull();
  });

  // Verifica que descartar el pendiente limpie el estado sin tocar backend ni carrito.
  it('Descartar el pendiente limpia el banner sin tocar backend', () => {
    driveToPending();
    expect(fixture.nativeElement.querySelector('.pending-ticket-banner')).toBeTruthy();

    (fixture.nativeElement.querySelectorAll('.pending-ticket-btn')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(page.pendingTicketSaleId()).toBeNull();
    expect(fixture.nativeElement.querySelector('.pending-ticket-banner')).toBeNull();
    expect(TestBed.inject(SalesFacade).sales()).toHaveLength(0);
  });

  // Caso H (BUG2): verifica que la venta exitosa normal siga intacta (ticket, limpieza y recargas).
  it('Caso H: venta exitosa normal conserva el flujo completo', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush(saleDto);
    httpMock.expectOne(DETALLE).flush(detailDto);
    httpMock.expectOne(`${API}/ventas/70/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(70);
    expect(page.pendingTicketSaleId()).toBeNull();
    expect(page.cartItems()).toHaveLength(0);
  });
});
