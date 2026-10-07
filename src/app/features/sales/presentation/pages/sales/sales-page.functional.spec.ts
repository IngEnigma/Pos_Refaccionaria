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

// Funcional: página de ventas real con todos los colaboradores reales (page, carrito,
// facades, usecases, repositorios, interceptores, sesión, toasts, iconos como en app.config).
// Se valida comportamiento observable (DOM + estado) desde la perspectiva del usuario.
describe('SalesPageComponent (funcional)', () => {
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
    id: 1,
    id_producto: 101,
    nombre: 'Filtro de aceite',
    clave: 'FLT-1234',
    marca: 'ACME',
    codigo_barras: '7501234567890',
    precio_venta: '150.00',
    precio_sucursal: '120.00',
    precio_base: '100.00',
    costo: '80.00',
    cantidad: 5,
  };

  const inventoryDto = [{ id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles: [itemDto] }];

  const ticketDto = {
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedora',
    metodo_pago: 'EFECTIVO',
    sucursal: 'Central',
    productos: [{ nombre: 'Filtro de aceite', cantidad: 1, precio_unitario: '120.00', subtotal: '120.00' }],
    total: '139.20',
  };

  const PAGO = { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' };

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

  function processButton(): HTMLButtonElement {
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const found = Array.from(buttons).find((b) => b.textContent.includes('Procesar transacción') || b.textContent.includes('Procesando'));
    if (!found) throw new Error('Botón de procesar no encontrado en el DOM');
    return found;
  }

  function summaryRow(label: string): string {
    const rows = fixture.nativeElement.querySelectorAll('.summary-row') as NodeListOf<HTMLElement>;
    const row = Array.from(rows).find((r) => r.textContent.includes(label));
    if (!row) throw new Error(`Fila de resumen no encontrada: ${label}`);
    return row.textContent;
  }

  function flushSuccessfulSale(id: number, cantidad: number) {
    httpMock.expectOne(VENTAS).flush({ id, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' });
    httpMock.expectOne(DETALLE).flush({ id: id + 100, id_producto: 101, id_venta: id, subtotal: '120.00', cantidad });
    httpMock.expectOne(`${API}/ventas/${id}/ticket/`).flush({ ...ticketDto, folio: id });
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
  }

  // F1: verifica que los botones +/−/eliminar del carrito actualicen cantidad, DOM y líneas.
  it('F1: botones del carrito (+/−/eliminar) actualizan cantidad y DOM', () => {
    page.onAddToCart(page.productos()[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.qty-value').textContent).toContain('1');
    expect(fixture.nativeElement.querySelector('.cart-item-desc').textContent).toContain('FLT-1234');

    const qtyButtons = fixture.nativeElement.querySelectorAll('.qty-circle') as NodeListOf<HTMLButtonElement>;
    qtyButtons[1].click();
    fixture.detectChanges();
    expect(page.cartItems()[0].qty).toBe(2);
    expect(fixture.nativeElement.querySelector('.qty-value').textContent).toContain('2');

    qtyButtons[0].click();
    fixture.detectChanges();
    expect(page.cartItems()[0].qty).toBe(1);
    expect(fixture.nativeElement.querySelector('.qty-value').textContent).toContain('1');

    (fixture.nativeElement.querySelector('.remove-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(page.cartItems()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No hay productos agregados.');
  });

  // F5a: verifica que con el carrito vacío el botón de procesar esté deshabilitado.
  it('F5a: carrito vacío mantiene deshabilitado el procesar', () => {
    page.onSelectPayment(PAGO);
    fixture.detectChanges();

    expect(page.submitDisabled()).toBe(true);
    expect(processButton().disabled).toBe(true);
  });

  // F5b: verifica que sin método de pago el botón de procesar esté deshabilitado aunque haya productos.
  it('F5b: sin método de pago el procesar está deshabilitado aunque haya productos', () => {
    page.onAddToCart(page.productos()[0]);
    fixture.detectChanges();

    expect(page.submitDisabled()).toBe(true);
    expect(processButton().disabled).toBe(true);
  });

  // F5c: verifica que con carrito y pago el botón se habilite, y se deshabilite mientras crea la venta.
  it('F5c: con carrito y pago habilita; creando la venta deshabilita', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);
    fixture.detectChanges();

    expect(page.submitDisabled()).toBe(false);
    expect(processButton().disabled).toBe(false);

    page.processTransaction();
    fixture.detectChanges();
    expect(page.submitDisabled()).toBe(true);
    expect(processButton().disabled).toBe(true);

    flushSuccessfulSale(50, 1);
    fixture.detectChanges();
    expect(page.lastTicket()?.folio).toBe(50);
  });

  // F6: verifica que el resumen renderice subtotal, descuento, IVA y total exactos para $120.
  it('F6: el resumen muestra subtotal, descuento, IVA y total exactos', () => {
    page.onAddToCart(page.productos()[0]);
    fixture.detectChanges();

    expect(summaryRow('Subtotal')).toContain('$120');
    expect(summaryRow('Descuento')).toContain('$0');
    expect(summaryRow('IVA')).toContain('$19.2');
    expect((fixture.nativeElement.querySelector('.total-amount') as HTMLElement).textContent).toContain('$139.2');
  });

  // F7: verifica que la UI muestre $120 y el payload conserve el contrato (sin precios calculados por frontend).
  it('F7: precio mostrado $120 y payload sin precios del frontend', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.product-price').textContent).toContain('$120');

    page.processTransaction();
    const saleReq = httpMock.expectOne(VENTAS);
    expect(saleReq.request.body).toEqual({ id_metodoPago: 1 });
    saleReq.flush({ id: 50, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' });

    const detailReq = httpMock.expectOne(DETALLE);
    expect(detailReq.request.body).toEqual({ id_producto: 101, id_venta: 50, cantidad: 1 });
    expect(detailReq.request.body).not.toHaveProperty('precio');
    detailReq.flush({ id: 11, id_producto: 101, id_venta: 50, subtotal: '120.00', cantidad: 1 });

    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));

    expect(page.lastTicket()?.folio).toBe(50);
  });

  // F8: verifica que un 500 en la venta muestre error, conserve el carrito y libere el botón.
  it('F8: error 500 en la venta conserva el carrito y libera el botón', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);
    fixture.detectChanges();

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush({ error: 'Error al registrar la venta.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(lastToast().type).toBe('error');
    expect(lastToast().message).toContain('Error al registrar la venta.');
    expect(page.cartItems()).toHaveLength(1);
    expect(page.cartItems()[0].qty).toBe(1);
    expect(page.isCreatingSale()).toBe(false);
    expect(page.submitDisabled()).toBe(false);
    expect(processButton().disabled).toBe(false);
  });

  // F9: verifica que tras un error el usuario pueda reintentar y la segunda venta funcione con ticket.
  it('F9: reintento tras error registra la venta y muestra el ticket', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    httpMock.expectOne(VENTAS).flush('Fallo temporal', { status: 500, statusText: 'Server Error' });
    expect(page.cartItems()).toHaveLength(1);

    page.processTransaction();
    flushSuccessfulSale(50, 1);
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(50);
    expect(page.cartItems()).toHaveLength(0);
    expect(lastToast().type).toBe('success');
  });

  // F10: verifica que cerrar el ticket oculte el modal manteniendo la venta registrada.
  it('F10: cerrar el ticket oculta el modal y mantiene la venta registrada', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    flushSuccessfulSale(50, 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-content')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Ticket #50');

    (fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(page.lastTicket()).toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-content')).toBeNull();
    expect(page.cartItems()).toHaveLength(0);
  });

  // F11 (regresión BUG1): verifica que la segunda invocación en vuelo se ignore (un solo POST).
  it('F11: doble invocación en vuelo emite un solo POST de venta', () => {
    // La guardia in-flight de processTransaction ignora la segunda llamada mientras crea la venta.
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment(PAGO);

    page.processTransaction();
    page.processTransaction();

    const sales = httpMock.match((req) => req.method === 'POST' && req.url === VENTAS);
    expect(sales).toHaveLength(1);
    sales[0].flush({ id: 50, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' });
    httpMock.expectOne(DETALLE).flush({ id: 11, id_producto: 101, id_venta: 50, subtotal: '120.00', cantidad: 1 });
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();

    expect(page.lastTicket()?.folio).toBe(50);
    expect(page.cartItems()).toHaveLength(0);
  });
});
