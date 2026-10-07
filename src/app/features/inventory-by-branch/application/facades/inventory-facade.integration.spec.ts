import { fakeAsync, TestBed, tick } from '@angular/core/testing';
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
import { UrlSanitizerService } from '@core/utils/url-sanitizer.service';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { RetryStrategyService } from '@core/http/retry/retry.strategy';
import { HttpErrorHandlerService } from '@core/http/error/http-error.handler';
import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { InventoryByBranchFacade } from './inventory-by-branch.facade';
import { GetMyBranchInventoryUseCase } from '@features/inventory-by-branch/application/usecase/get-my-branch-inventory.usecase';
import { GetMovementsUseCase } from '@features/inventory-by-branch/application/usecase/get-movements.usecase';
import { RegisterMovementUseCase } from '@features/inventory-by-branch/application/usecase/register-movement.usecase';
import { InventoryRepository } from '@features/inventory-by-branch/domain/repository/inventory-repository';
import { InventoryRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/inventory-repository.impl';
import { InventoryMovementRepository } from '@features/inventory-by-branch/domain/repository/movement-repository';
import { InventoryMovementRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/movement-repository.impl';

// Integración real: Facade -> UseCase -> Repositorio -> HttpClient con el interceptor
// de errores/reintentos de producción. Sin dobles de colaboradores.
describe('InventoryByBranchFacade (integración)', () => {
  const API = environment.apiUrl;
  const MI_SUCURSAL = `${API}/inventarios/mi-sucursal/`;
  let httpMock: HttpTestingController;
  let facade: InventoryByBranchFacade;

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

  const inventoryDto = [
    { id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles: [itemDto] },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: STORAGE_PORT, useClass: InMemoryStorageService },
        { provide: PERSISTENT_STORAGE_PORT, useClass: LocalStorageService },
        UrlSanitizerService,
        RetryStrategyService,
        HttpErrorHandlerService,
        SessionStateService,
        InventoryByBranchFacade,
        GetMyBranchInventoryUseCase,
        GetMovementsUseCase,
        RegisterMovementUseCase,
        { provide: InventoryRepository, useClass: InventoryRepositoryImpl },
        { provide: InventoryMovementRepository, useClass: InventoryMovementRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(InventoryByBranchFacade);
  });

  afterEach(() => httpMock.verify());

  // Verifica que el inventario HTTP quede mapeado en el estado (precios como número, cantidades intactas).
  it('carga el inventario mapeando precios y cantidades', () => {
    facade.loadMyBranchInventory();
    expect(facade.loading()).toBe(true);

    httpMock.expectOne(MI_SUCURSAL).flush(inventoryDto);

    expect(facade.allItems()).toHaveLength(1);
    expect(facade.allItems()[0]).toEqual({
      id: 1,
      idProducto: 101,
      nombre: 'Filtro de aceite',
      clave: 'FLT-1234',
      marca: 'ACME',
      codigoBarras: '7501234567890',
      precioVenta: 150,
      precioSucursal: 120,
      precioBase: 100,
      costo: 80,
      cantidad: 5,
    });
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que un 500 con {"error"} deje el mensaje del backend y el loading apagado.
  it('ante 500 expone el mensaje del backend y libera la carga', () => {
    facade.loadMyBranchInventory();

    httpMock.expectOne(MI_SUCURSAL).flush({ error: 'No fue posible leer el inventario.' }, { status: 500, statusText: 'Server Error' });

    expect(facade.allItems()).toEqual([]);
    expect(facade.errorMessage()).toBe('No fue posible leer el inventario.');
    expect(facade.loading()).toBe(false);
  });

  // Verifica que ante error de red el interceptor reintente (GET + status 0) y al agotarse exponga el error.
  it('ante error de red reintenta y luego expone el error', fakeAsync(() => {
    facade.loadMyBranchInventory();

    // Intento inicial + 2 reintentos de la configuración real (maxRetries: 2).
    httpMock.expectOne(MI_SUCURSAL).error(new ProgressEvent('error'));
    tick(10000);
    httpMock.expectOne(MI_SUCURSAL).error(new ProgressEvent('error'));
    tick(10000);
    httpMock.expectOne(MI_SUCURSAL).error(new ProgressEvent('error'));
    tick(10000);

    expect(facade.allItems()).toEqual([]);
    expect(facade.errorMessage()).toBeTruthy();
    expect(facade.loading()).toBe(false);
  }));

  // Verifica que un precio no numérico se propague sin validación del mapper (caso no contemplado).
  it('precio no numérico se propaga sin validación del mapper', () => {
    facade.loadMyBranchInventory();

    httpMock.expectOne(MI_SUCURSAL).flush([
      { id_inventario: 7, descripcion: 'Central', id_sucursal: 3, detalles: [{ ...itemDto, precio_venta: 'no-numérico' }] },
    ]);

    expect(Number.isNaN(facade.allItems()[0].precioVenta)).toBe(true);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que una respuesta vacía deje el catálogo vacío sin error.
  it('respuesta vacía deja el catálogo vacío sin error', () => {
    facade.loadMyBranchInventory();

    httpMock.expectOne(MI_SUCURSAL).flush([]);

    expect(facade.allItems()).toEqual([]);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });
});
