import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

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

// Integración real de punta a punta del frontend (sin backend real):
// Page -> SalesCartService -> SalesFacade -> UseCases -> Repositorios -> HttpClient
// con la cadena real de interceptores de app.config + Auth/Session/Toast/Search reales.
// Único borde simulado: el transporte HTTP (HttpTestingController) y crypto.randomUUID (shim de entorno).
describe('SalesPageComponent (integración)', () => {
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

  const itemDto = (overrides = {}) => ({
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
    ...overrides,
  });

  const inventoryDto = (detalles: unknown[]) => ([
    { id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles },
  ]);

  const ticketDto = {
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedor1',
    metodo_pago: 'EFECTIVO',
    sucursal: 'Central',
    productos: [{ nombre: 'Filtro de aceite', cantidad: 1, precio_unitario: '120.00', subtotal: '120.00' }],
    total: '139.20',
  };

  beforeAll(() => {
    // Shims de entorno: jsdom no expone crypto.randomUUID (lo requiere ToastService)
    // ni IntersectionObserver (lo usa ProductGridComponent). No alteran lógica de producción.
    const g = globalThis as Record<string, unknown>;
    if (!g['crypto']) g['crypto'] = {};
    const c = g['crypto'] as Record<string, unknown>;
    if (typeof c['randomUUID'] !== 'function') c['randomUUID'] = () => `uuid-${Math.random()}`;
    if (typeof g['IntersectionObserver'] !== 'function') {
      g['IntersectionObserver'] = class {
        observe() { /* jsdom sin scroll: el sentinel nunca intersecta */ }
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
  });

  afterEach(() => httpMock.verify());

  // Vacía las 4 cargas iniciales de la página (inventario x2 por efecto+ngOnInit, ventas, pagos, tipos).
  function flushStartup(inventario: unknown[]) {
    httpMock.match(INV).forEach((r) => r.flush(inventario));
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(METODOS).forEach((r) => r.flush([]));
    httpMock.match(TIPOS).forEach((r) => r.flush([]));
  }

  function lastToast() {
    const all = toasts.toasts();
    return all[all.length - 1];
  }

  // Verifica que el inventario HTTP llegue al catálogo con id, nombre, precio de sucursal, stock y código intactos.
  it('el inventario del backend aparece en el catálogo con datos íntegros', () => {
    flushStartup(inventoryDto([itemDto()]));

    expect(page.productos()).toHaveLength(1);
    expect(page.productos()[0]).toEqual({
      id: 101,
      nombre: 'Filtro de aceite',
      descripcion: 'FLT-1234',
      precio: 120,
      stock: 5,
      codigoBarras: '7501234567890',
      imagen: 'assets/images/Refaccionaria.webp',
      hasSucursalPrice: true,
    });
  });

  // Verifica que sin precio de sucursal el catálogo use el precio base del backend.
  it('sin precio de sucursal el catálogo usa el precio base', () => {
    flushStartup(inventoryDto([itemDto({ precio_sucursal: null, precio_base: '100.00' })]));

    expect(page.productos()[0].precio).toBe(100);
    expect(page.productos()[0].hasSucursalPrice).toBe(false);
  });

  // Verifica el flujo barcode -> producto encontrado -> carrito con datos íntegros.
  it('código de barras válido agrega el producto al carrito', () => {
    flushStartup(inventoryDto([itemDto()]));

    page.barcodeInput.set('7501234567890');
    page.onBarcodeKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(page.cartItems()).toHaveLength(1);
    expect(page.cartItems()[0]).toEqual({
      productId: 101,
      nombre: 'Filtro de aceite',
      descripcion: 'FLT-1234',
      precio: 120,
      imagen: 'assets/images/Refaccionaria.webp',
      qty: 1,
      stock: 5,
    });
    expect(lastToast().type).toBe('success');
  });

  // Verifica que un código inexistente avise y no toque el carrito.
  it('código de barras inexistente avisa sin agregar nada', () => {
    flushStartup(inventoryDto([itemDto()]));

    page.barcodeInput.set('0000000000000');
    page.onBarcodeKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(page.cartItems()).toHaveLength(0);
    expect(lastToast().type).toBe('warning');
  });

  // Verifica que un producto agotado no entre al carrito ni por código de barras.
  it('producto sin stock no entra al carrito por código de barras', () => {
    flushStartup(inventoryDto([itemDto({ cantidad: 0 })]));

    page.barcodeInput.set('7501234567890');
    page.onBarcodeKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(page.cartItems()).toHaveLength(0);
    expect(lastToast().type).toBe('error');
  });

  // Verifica que un 500 en inventario deje el error en el facade y el catálogo vacío.
  it('error 500 del inventario deja el mensaje en el facade y catálogo vacío', () => {
    httpMock.match(INV).forEach((r) => r.flush('Fallo', { status: 500, statusText: 'Server Error' }));
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(METODOS).forEach((r) => r.flush([]));
    httpMock.match(TIPOS).forEach((r) => r.flush([]));

    const inventoryFacade = TestBed.inject(InventoryByBranchFacade);
    expect(inventoryFacade.errorMessage()).toBeTruthy();
    expect(inventoryFacade.loading()).toBe(false);
    expect(page.productos()).toEqual([]);
  });

  // Verifica que el mapper propague el DTO sin validar (precio no numérico llega como NaN).
  it('DTO con precio no numérico se propaga sin validación del mapper', () => {
    flushStartup(inventoryDto([itemDto({ precio_venta: 'no-numérico', precio_sucursal: null, precio_base: 'no-numérico' })]));

    const inventoryFacade = TestBed.inject(InventoryByBranchFacade);
    expect(Number.isNaN(inventoryFacade.allItems()[0].precioVenta)).toBe(true);
  });

  // Verifica la venta completa: stock fresco suficiente -> POSTs -> ticket en el modal -> carrito vacío.
  it('con stock suficiente la venta se registra y muestra el ticket', () => {
    flushStartup(inventoryDto([itemDto()]));
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    page.processTransaction();

    httpMock.expectOne(VENTAS).flush({ id: 50, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' });
    const detail = httpMock.expectOne(DETALLE);
    expect(detail.request.body).toEqual({ id_producto: 101, id_venta: 50, cantidad: 1 });
    detail.flush({ id: 11, id_producto: 101, id_venta: 50, subtotal: '120.00', cantidad: 1 });
    httpMock.expectOne(`${API}/ventas/50/ticket/`).flush(ticketDto);
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    // processTransaction recarga el inventario tras el éxito (sales.page.ts).
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto([itemDto()])));

    expect(page.lastTicket()?.folio).toBe(50);
    expect(page.cartItems()).toHaveLength(0);
    expect(lastToast().type).toBe('success');
  });

  // Verifica que con stock insuficiente la venta se rechace sin emitir POST y el carrito intacto.
  it('con stock insuficiente la venta se rechaza sin POST y el carrito intacto', () => {
    flushStartup(inventoryDto([itemDto({ cantidad: 5 })]));
    page.onAddToCart(page.productos()[0]);
    page.onAddToCart(page.productos()[0]);
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    httpMock.expectOne(INV).flush(inventoryDto([itemDto({ cantidad: 2 })]));

    page.processTransaction();

    httpMock.expectNone((req) => req.method === 'POST' && req.url === VENTAS);
    expect(page.cartItems()).toHaveLength(1);
    expect(page.cartItems()[0].qty).toBe(3);
    expect(lastToast().type).toBe('error');
    expect(lastToast().message).toContain('Stock insuficiente');
  });

  // Verifica que un producto agotado en el fresco (0) bloquee la venta sin POST.
  it('producto agotado en el stock fresco bloquea la venta', () => {
    flushStartup(inventoryDto([itemDto({ cantidad: 5 })]));
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    httpMock.expectOne(INV).flush(inventoryDto([itemDto({ cantidad: 0 })]));

    page.processTransaction();

    httpMock.expectNone((req) => req.method === 'POST' && req.url === VENTAS);
    expect(lastToast().type).toBe('error');
  });

  // Verifica que un producto desaparecido del fresco bloquee la venta y dispare recarga del catálogo.
  it('producto desaparecido del fresco bloquea la venta y recarga el catálogo', () => {
    flushStartup(inventoryDto([itemDto()]));
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    httpMock.expectOne(INV).flush(inventoryDto([]));

    page.processTransaction();

    httpMock.expectNone((req) => req.method === 'POST' && req.url === VENTAS);
    expect(lastToast().message).toContain('ya no está disponible');
    httpMock.expectOne(INV).flush(inventoryDto([itemDto()]));
  });

  // Verifica que un cambio de stock a la baja pero aún suficiente permita la venta.
  it('cambio de stock a la baja pero suficiente permite la venta', () => {
    flushStartup(inventoryDto([itemDto({ cantidad: 5 })]));
    page.onAddToCart(page.productos()[0]);
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    httpMock.expectOne(INV).flush(inventoryDto([itemDto({ cantidad: 2 })]));

    page.processTransaction();

    const sale = httpMock.expectOne(VENTAS);
    expect(sale.request.method).toBe('POST');
    sale.flush({ id: 51, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '240.00', fecha: '2024-01-01' });
    httpMock.expectOne(DETALLE).flush({ id: 12, id_producto: 101, id_venta: 51, subtotal: '240.00', cantidad: 2 });
    httpMock.expectOne(`${API}/ventas/51/ticket/`).flush({ ...ticketDto, folio: 51 });
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    // processTransaction recarga el inventario tras el éxito (sales.page.ts).
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto([itemDto()])));

    expect(page.lastTicket()?.folio).toBe(51);
  });

  // Verifica que sin sesión las peticiones de Ventas salgan sin Authorization (pass-through real del interceptor).
  it('sin sesión las peticiones de Ventas no llevan Authorization', () => {
    flushStartup(inventoryDto([itemDto()]));

    TestBed.inject(SalesFacade).loadSales();
    const req = httpMock.expectOne(VENTAS);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush([]);
  });
});
