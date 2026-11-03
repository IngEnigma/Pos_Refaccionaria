import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { InventoryByBranchFacade } from './inventory-by-branch.facade';
import { GetMyBranchInventoryUseCase } from '../usecase/get-my-branch-inventory.usecase';
import { GetMovementsUseCase } from '../usecase/get-movements.usecase';
import { RegisterMovementUseCase } from '../usecase/register-movement.usecase';
import { BranchInventory } from '../domain/entities/inventory.entity';
import { InventoryItem } from '../domain/entities/inventory-item.entity';
import { InventoryMovement, RegisterMovementPayload } from '../domain/entities/inventory-movement.entity';
import { LoggerService } from '@core/logging/logger.service';

// Unitario: fachada con casos de uso sustituidos por stubs (sin HTTP). El camino HTTP
// real ya está cubierto por inventory-facade.integration.spec.ts.
describe('InventoryByBranchFacade', () => {
  let facade: InventoryByBranchFacade;
  let getMyBranchInventoryUseCase: { execute: jest.Mock };
  let getMovementsUseCase: { execute: jest.Mock };
  let registerMovementUseCase: { execute: jest.Mock };
  let loggerError: jest.Mock;
  let loggerWarn: jest.Mock;

  const makeItem = (idProducto: number): InventoryItem => ({
    id: idProducto * 10,
    idProducto,
    nombre: `Producto ${idProducto}`,
    clave: `K${idProducto}`,
    marca: 'Marca',
    codigoBarras: `750${idProducto}`,
    precioVenta: 100,
    precioSucursal: null,
    precioBase: 100,
    costo: 50,
    cantidad: 10,
    vigenteDesde: null,
  });

  const makeInventory = (idInventario: number, items: InventoryItem[]): BranchInventory => ({
    idInventario,
    descripcion: `Inventario ${idInventario}`,
    idSucursal: 1,
    detalles: items,
  });

  const movement: InventoryMovement = {
    id: 1,
    tipo: 'SALIDA',
    cantidad: 2,
    fecha: '2026-09-18T00:00:00Z',
    razon: 'Venta',
    observaciones: null,
  };

  beforeEach(() => {
    getMyBranchInventoryUseCase = { execute: jest.fn() };
    getMovementsUseCase = { execute: jest.fn() };
    registerMovementUseCase = { execute: jest.fn() };
    loggerError = jest.fn();
    loggerWarn = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        InventoryByBranchFacade,
        { provide: GetMyBranchInventoryUseCase, useValue: getMyBranchInventoryUseCase },
        { provide: GetMovementsUseCase, useValue: getMovementsUseCase },
        { provide: RegisterMovementUseCase, useValue: registerMovementUseCase },
        {
          provide: LoggerService,
          useValue: { withContext: jest.fn().mockReturnValue({ error: loggerError, warn: loggerWarn }) },
        },
      ],
    });

    facade = TestBed.inject(InventoryByBranchFacade);
  });

  // Comprueba que antes de cargar nada los signals estén vacíos.
  it('inicia con el estado vacío por defecto', () => {
    expect(facade.inventory()).toEqual([]);
    expect(facade.allItems()).toEqual([]);
    expect(facade.selectedInventory()).toBeNull();
    expect(facade.movements()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que al cargar el inventario se aplanen los items y se seleccione el primero.
  it('loadMyBranchInventory aplana items y selecciona el primer inventario', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(
      of([makeInventory(1, [makeItem(1), makeItem(2)]), makeInventory(2, [makeItem(3)])]),
    );

    facade.loadMyBranchInventory();

    expect(facade.inventory()).toHaveLength(2);
    expect(facade.allItems().map((i) => i.idProducto)).toEqual([1, 2, 3]);
    expect(facade.selectedInventory()?.idInventario).toBe(1);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que una recarga no pise la selección que el usuario haya hecho.
  it('loadMyBranchInventory conserva la selección actual en la recarga', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(
      of([makeInventory(1, [makeItem(1)]), makeInventory(2, [makeItem(2)])]),
    );
    facade.loadMyBranchInventory();

    const second = facade.inventory()[1];
    facade.selectInventory(second);

    facade.loadMyBranchInventory();

    expect(facade.selectedInventory()?.idInventario).toBe(2);
  });

  // Comprueba que ante un error HTTP se exponga el mensaje del backend y se libere loading.
  it('loadMyBranchInventory con error expone el mensaje del backend', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Sin inventario.' }, status: 500 })),
    );

    facade.loadMyBranchInventory();

    expect(facade.errorMessage()).toBe('Sin inventario.');
    expect(facade.inventory()).toEqual([]);
    expect(facade.allItems()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });

  // EVIDENCIA COMPORTEMENTO: al fallar la recarga no se limpia selectedInventory, por lo que
  // puede quedar apuntando a un inventario ya no vigente (posible bug: estado obsoleto).
  it('BUG posible: una recarga fallida no limpia selectedInventory', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(of([makeInventory(1, [makeItem(1)])]));
    facade.loadMyBranchInventory();
    expect(facade.selectedInventory()).not.toBeNull();

    getMyBranchInventoryUseCase.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Fallo' }, status: 500 })),
    );
    facade.loadMyBranchInventory();

    expect(facade.errorMessage()).toBe('Fallo');
    expect(facade.inventory()).toEqual([]);
    // El inventario desapareció de la lista pero la selección persiste:
    expect(facade.selectedInventory()?.idInventario).toBe(1);
  });

  // Comprueba que selectInventory cambie el inventario elegido.
  it('selectInventory cambia el inventario seleccionado', () => {
    const inv = makeInventory(9, []);
    facade.selectInventory(inv);

    expect(facade.selectedInventory()).toBe(inv);
  });

  // Comprueba que loadMovements llene el listado de movimientos.
  it('loadMovements llena el listado', () => {
    getMovementsUseCase.execute.mockReturnValue(of([movement]));

    facade.loadMovements();

    expect(facade.movements()).toHaveLength(1);
    expect(facade.movements()[0].razon).toBe('Venta');
  });

  // EVIDENCIA COMPORTEMENTO: ante un error de movimientos se limpia la lista y NO se expone
  // errorMessage (solo se registra un warn); el usuario no ve ningún mensaje.
  it('loadMovements con error limpia la lista sin exponer errorMessage', () => {
    getMovementsUseCase.execute.mockReturnValue(throwError(() => new Error('red caída')));

    facade.loadMovements();

    expect(facade.movements()).toEqual([]);
    expect(facade.errorMessage()).toBeNull();
    expect(loggerWarn).toHaveBeenCalled();
  });

  // Comprueba que registerMovement gestione loading durante la operación y limpie el error previo.
  it('registerMovement gestiona loading y limpia errores previos', () => {
    const payload: RegisterMovementPayload = {
      idInventario: 1,
      tipoMovimiento: 'ENTRADA',
      razon: 'Compra',
      items: [{ idProducto: 5, cantidad: 2 }],
    };
    registerMovementUseCase.execute.mockImplementation(() => {
      expect(facade.loading()).toBe(true);
      return of({});
    });

    facade.registerMovement(payload).subscribe();

    expect(registerMovementUseCase.execute).toHaveBeenCalledWith(payload);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que al fallar registerMovement se exponga el mensaje del backend y el error se propague.
  it('registerMovement con error expone el mensaje y propaga', () => {
    const error = new HttpErrorResponse({ error: { error: 'Stock insuficiente.' }, status: 400 });
    registerMovementUseCase.execute.mockReturnValue(throwError(() => error));

    let propagated: unknown;
    facade
      .registerMovement({
        idInventario: 1,
        tipoMovimiento: 'SALIDA',
        razon: 'Merma',
        items: [{ idProducto: 5, cantidad: 999 }],
      })
      .subscribe({ error: (e: unknown) => (propagated = e) });

    expect(propagated).toBe(error);
    expect(facade.errorMessage()).toBe('Stock insuficiente.');
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que refreshAll dispare ambas cargas (inventario y movimientos).
  it('refreshAll recarga inventario y movimientos', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(of([]));
    getMovementsUseCase.execute.mockReturnValue(of([]));

    facade.refreshAll();

    expect(getMyBranchInventoryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(getMovementsUseCase.execute).toHaveBeenCalledTimes(1);
  });

  // Comprueba que clearError elimine el mensaje de error almacenado.
  it('clearError limpia errorMessage', () => {
    getMyBranchInventoryUseCase.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Fallo' }, status: 500 })),
    );
    facade.loadMyBranchInventory();
    expect(facade.errorMessage()).toBe('Fallo');

    facade.clearError();

    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que un error sin estructura (objeto plano) use el mensaje genérico.
  it('error sin estructura usa el mensaje genérico', () => {
    registerMovementUseCase.execute.mockReturnValue(throwError(() => ({ weird: true })));

    facade
      .registerMovement({
        idInventario: 1,
        tipoMovimiento: 'ENTRADA',
        razon: 'Compra',
        items: [{ idProducto: 1, cantidad: 1 }],
      })
      .subscribe({ error: () => undefined });

    expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
  });

  // Comprueba que un Error simple exponga su message.
  it('un Error simple expone su message', () => {
    registerMovementUseCase.execute.mockReturnValue(throwError(() => new Error('timeout')));

    facade
      .registerMovement({
        idInventario: 1,
        tipoMovimiento: 'ENTRADA',
        razon: 'Compra',
        items: [{ idProducto: 1, cantidad: 1 }],
      })
      .subscribe({ error: () => undefined });

    expect(facade.errorMessage()).toBe('timeout');
  });
});
