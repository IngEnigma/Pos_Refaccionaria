import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InventoryMovementRepositoryImpl } from './movement-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { RegisterMovementPayload } from '@features/inventory-by-branch/domain/entities/inventory-movement.entity';

// Unitario: adaptador HTTP de movimientos de inventario con HttpTestingController.
describe('InventoryMovementRepositoryImpl', () => {
  let repository: InventoryMovementRepositoryImpl;
  let httpMock: HttpTestingController;

  const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };
  const movementsUrl = 'http://api.test/movimientos-inventario/';
  const bulkUrl = 'http://api.test/detalles-inventario/bulk/';

  const movementDto = {
    id: 12,
    tipo: 'ENTRADA' as const,
    cantidad: 10,
    fecha: '2026-09-18T12:00:00Z',
    razon: 'Compra',
    observaciones: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryMovementRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(InventoryMovementRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Comprueba que la lista de movimientos se solicite en GET y se mapee a entidades.
  it('getMovements envía GET y mapea los movimientos', () => {
    repository.getMovements().subscribe((movements) => {
      expect(movements).toHaveLength(1);
      expect(movements[0]).toEqual({
        id: 12,
        tipo: 'ENTRADA',
        cantidad: 10,
        fecha: '2026-09-18T12:00:00Z',
        razon: 'Compra',
        observaciones: null,
      });
    });

    const req = httpMock.expectOne(movementsUrl);
    expect(req.request.method).toBe('GET');
    req.flush([movementDto]);
  });

  // Comprueba que registrar un movimiento haga POST al endpoint bulk con el body snake_case.
  it('registerEntryExit envía POST al bulk con body snake_case', () => {
    const payload: RegisterMovementPayload = {
      idInventario: 3,
      tipoMovimiento: 'SALIDA',
      razon: 'Merma',
      observaciones: 'Dañado',
      items: [{ idProducto: 7, cantidad: 2 }],
    };

    repository.registerEntryExit(payload).subscribe();

    const req = httpMock.expectOne(bulkUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_inventario: 3,
      tipo_movimiento: 'SALIDA',
      razon: 'Merma',
      observaciones: 'Dañado',
      id_proveedor: undefined,
      items: [{ id_producto: 7, cantidad: 2 }],
    });
    req.flush({ ok: true });
  });
});
