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

// Funcional: catálogo de ventas real (búsqueda, vacíos, skeletons, slider, venta multi-producto,
// fallo de ticket, recarga). Todos los colaboradores son reales; solo el transporte HTTP es falso.
describe('Catálogo de ventas (funcional)', () => {
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
  let search: GlobalSearchService;

  const filtroDto = {
    id: 1, id_producto: 101, nombre: 'Filtro de aceite', clave: 'FLT-1234', marca: 'ACME',
    codigo_barras: '7501234567890', precio_venta: '150.00', precio_sucursal: '120.00',
    precio_base: '100.00', costo: '80.00', cantidad: 5,
  };
  const bujiaDto = {
    id: 2, id_producto: 202, nombre: 'Bujía NGK', clave: 'BJ-5678', marca: 'NGK',
    codigo_barras: '7509990001112', precio_venta: '60.00', precio_sucursal: null,
    precio_base: '50.00', costo: '30.00', cantidad: 8,
  };
  const inventoryDto = [{ id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles: [filtroDto, bujiaDto] }];

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
    search = TestBed.inject(GlobalSearchService);
    TestBed.inject(SessionStateService).setSucursalId(7);
    fixture = TestBed.createComponent(SalesPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(METODOS).forEach((r) => r.flush([]));
    httpMock.match(TIPOS).forEach((r) => r.flush([]));
    fixture.detectChanges();
  });

  afterEach(() => {
    search.setSearchQuery('');
    httpMock.verify();
  });

  function cardNames(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.product-name') as NodeListOf<HTMLElement>)
      .map((el) => el.textContent.trim());
  }

  // P2.1a: verifica que el buscador filtre el grid por nombre de producto.
  it('P2.1a: el buscador filtra por nombre', () => {
    search.setSearchQuery('bujía');
    fixture.detectChanges();

    expect(cardNames()).toEqual(['Bujía NGK']);
  });

  // P2.1b: verifica que el buscador filtre por clave del producto.
  it('P2.1b: el buscador filtra por clave', () => {
    search.setSearchQuery('FLT-1234');
    fixture.detectChanges();

    expect(cardNames()).toEqual(['Filtro de aceite']);
  });

  // P2.1c: verifica que el buscador filtre por código de barras.
  it('P2.1c: el buscador filtra por código de barras', () => {
    search.setSearchQuery('7509990001112');
    fixture.detectChanges();

    expect(cardNames()).toEqual(['Bujía NGK']);
  });

  // P2.1d: verifica que el buscador filtre por marca del producto.
  it('P2.1d: el buscador filtra por marca', () => {
    search.setSearchQuery('ngk');
    fixture.detectChanges();

    expect(cardNames()).toEqual(['Bujía NGK']);
  });

  // P2.2: verifica que con inventario vacío el usuario vea el aviso correspondiente.
  it('P2.2: inventario vacío muestra el aviso al usuario', () => {
    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    httpMock.expectOne(INV).flush([]);
    fixture.detectChanges();

    expect(cardNames()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Sin productos con stock en tu sucursal.');
  });

  // P2.3: verifica skeletons durante la carga y su reemplazo por el contenido al terminar.
  it('P2.3: skeletons durante la carga y contenido al terminar', () => {
    TestBed.inject(InventoryByBranchFacade).loadMyBranchInventory();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-product-card-skeleton')).toBeTruthy();

    httpMock.expectOne(INV).flush(inventoryDto);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-product-card-skeleton')).toBeNull();
    expect(cardNames()).toEqual(['Filtro de aceite', 'Bujía NGK']);
  });

  // P2.4: verifica que el slider auto-seleccione la primera categoría sin filtrar el catálogo (comportamiento real).
  it('P2.4: el slider auto-selecciona la primera categoría sin filtrar el catálogo', () => {
    TestBed.inject(ProductTypesFacade).loadProductTypes();
    httpMock.expectOne(TIPOS).flush([{ id: 5, nombre: 'Filtros' }]);
    fixture.detectChanges();

    // El slider emite cats[0] (Todos, id 0) y la página lo registra; el filtrado por tipo
    // está deshabilitado en el código, así que el catálogo sigue completo (conducta real).
    expect(page.selectedCategoryId()).toBe(0);
    expect(cardNames()).toEqual(['Filtro de aceite', 'Bujía NGK']);
  });

  // P2.5: verifica la venta con dos productos: dos detalles y ticket con dos líneas.
  it('P2.5: venta con dos productos genera dos detalles y ticket con dos líneas', () => {
    page.onAddToCart(page.productos()[0]);
    page.onAddToCart(page.productos()[1]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    page.processTransaction();

    httpMock.expectOne(VENTAS).flush({ id: 60, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '170.00', fecha: '2024-01-01' });
    const details = httpMock.match(DETALLE);
    expect(details).toHaveLength(2);
    expect(details.map((r) => r.request.body)).toEqual([
      { id_producto: 101, id_venta: 60, cantidad: 1 },
      { id_producto: 202, id_venta: 60, cantidad: 1 },
    ]);
    details[0].flush({ id: 21, id_producto: 101, id_venta: 60, subtotal: '120.00', cantidad: 1 });
    details[1].flush({ id: 22, id_producto: 202, id_venta: 60, subtotal: '50.00', cantidad: 1 });
    httpMock.expectOne(`${API}/ventas/60/ticket/`).flush({
      folio: 60, fecha: '2024-01-01T00:00:00Z', vendedor: 'vendedora', metodo_pago: 'EFECTIVO',
      sucursal: 'Central',
      productos: [
        { nombre: 'Filtro de aceite', cantidad: 1, precio_unitario: '120.00', subtotal: '120.00' },
        { nombre: 'Bujía NGK', cantidad: 1, precio_unitario: '50.00', subtotal: '50.00' },
      ],
      total: '197.20',
    });
    httpMock.match(VENTAS).forEach((r) => r.flush([]));
    httpMock.match(INV).forEach((r) => r.flush(inventoryDto));
    fixture.detectChanges();

    expect(page.lastTicket()?.productos).toHaveLength(2);
    expect(page.cartItems()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('Ticket #60');
  });

  // P2.6: verifica que si el ticket falla con 404 NO se recargue inventario (BUG3) y el carrito se conserve.
  it('P2.6: fallo 404 del ticket no recarga inventario y conserva el carrito', () => {
    // Conducta corregida (BUG3): el 404 no es error de stock aunque el texto coincida con la regex.
    // El tap de limpieza solo corre en éxito: el carrito local se conserva (ver BUG2 pendiente).
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    page.processTransaction();

    httpMock.expectOne(VENTAS).flush({ id: 61, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '120.00', fecha: '2024-01-01' });
    httpMock.expectOne(DETALLE).flush({ id: 23, id_producto: 101, id_venta: 61, subtotal: '120.00', cantidad: 1 });
    httpMock.expectOne(`${API}/ventas/61/ticket/`).flush({ detail: 'Ticket no disponible.' }, { status: 404, statusText: 'Not Found' });
    httpMock.expectNone(INV);
    fixture.detectChanges();

    expect(page.lastTicket()).toBeNull();
    expect(page.cartItems()).toHaveLength(1);
    const all = toasts.toasts();
    expect(all[all.length - 1].type).toBe('error');
    expect(all[all.length - 1].message).toContain('Ticket no disponible.');
  });

  // P2.6b (regresión BUG3): verifica que un error real de stock (400) sí recargue el inventario.
  it('P2.6b: error 400 de stock sí recarga el inventario', () => {
    page.onAddToCart(page.productos()[0]);
    page.onSelectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

    page.processTransaction();

    httpMock.expectOne(VENTAS).flush({ error: 'Stock insuficiente para el producto.' }, { status: 400, statusText: 'Bad Request' });
    httpMock.expectOne(INV).flush(inventoryDto);
    fixture.detectChanges();

    expect(page.cartItems()).toHaveLength(1);
    const all = toasts.toasts();
    expect(all[all.length - 1].type).toBe('error');
    expect(all[all.length - 1].message).toContain('Stock insuficiente');
  });

  // P2.7: verifica que recargar actualice ventas e inventario observables en la página.
  it('P2.7: recargar actualiza ventas e inventario observables', () => {
    page.reloadSales();

    httpMock.expectOne(VENTAS).flush([
      { id: 9, id_usuario: 1, id_inventario: 7, id_metodoPago: 1, total: '139.20', fecha: '2024-01-02' },
    ]);
    httpMock.expectOne(INV).flush(inventoryDto);
    fixture.detectChanges();

    expect(TestBed.inject(SalesFacade).sales()).toHaveLength(1);
    expect(page.productos()).toHaveLength(2);
  });
});
