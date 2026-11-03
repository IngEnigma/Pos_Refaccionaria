import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, importProvidersFrom } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';
import {
  LucideAngularModule,
  Package,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Info,
  History,
  Plus,
  Warehouse,
} from 'lucide-angular';

import { InventoryByBranchPageComponent } from './inventory.page';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryByBranchFacade } from '../../../application/facades/inventory-by-branch.facade';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { BranchInventory } from '../../../domain/entities/inventory.entity';

// Unitario: lógica de la página de inventario por sucursal (carga inicial, apertura de
// diálogo de movimientos y manejo de errores) con fachadas y diálogo simulados.
describe('InventoryByBranchPageComponent', () => {
  let fixture: ComponentFixture<InventoryByBranchPageComponent>;
  let component: InventoryByBranchPageComponent;

  let sucursalId: ReturnType<typeof signal<number | null>>;
  let selectedInventory: ReturnType<typeof signal<BranchInventory | null>>;
  let errorMessage: ReturnType<typeof signal<string | null>>;
  let allItems: ReturnType<typeof signal<readonly InventoryItem[]>>;
  let loading: ReturnType<typeof signal<boolean>>;
  let movements: ReturnType<typeof signal<readonly unknown[]>>;
  let loadMyBranchInventory: jest.Mock;
  let loadMovements: jest.Mock;
  let registerMovement: jest.Mock;
  let refreshAll: jest.Mock;
  let toastError: jest.Mock;
  let toastSuccess: jest.Mock;
  let dialogOpen: jest.SpyInstance;

  const item: InventoryItem = {
    id: 55,
    idProducto: 7,
    nombre: 'Rótula Moog',
    clave: 'SKU-7',
    marca: 'Moog',
    codigoBarras: '75010000000007',
    precioVenta: 494.36,
    precioSucursal: 480,
    precioBase: 520.38,
    costo: 300.5,
    cantidad: 47,
    vigenteDesde: null,
  };

  const inventory: BranchInventory = {
    idInventario: 3,
    descripcion: 'Inventario 3',
    idSucursal: 1,
    detalles: [item],
  };

  beforeEach(() => {
    sucursalId = signal<number | null>(1);
    selectedInventory = signal<BranchInventory | null>(null);
    errorMessage = signal<string | null>(null);
    allItems = signal<readonly InventoryItem[]>([]);
    loading = signal(false);
    movements = signal<readonly unknown[]>([]);
    loadMyBranchInventory = jest.fn();
    loadMovements = jest.fn();
    registerMovement = jest.fn(() => of({}));
    refreshAll = jest.fn();
    toastError = jest.fn();
    toastSuccess = jest.fn();
    // El DialogModule del template provee un Dialog real que pisa al stub del TestBed;
    // se usa un spy de prototipo para interceptar dialog.open sin alterar la página.
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');

    TestBed.configureTestingModule({
      providers: [
        // Iconos lucide del template (tabla, lista de movimientos y encabezado).
        importProvidersFrom(
          LucideAngularModule.pick({
            Package,
            ArrowLeftRight,
            ArrowDownLeft,
            ArrowUpRight,
            Activity,
            Info,
            History,
            Plus,
            Warehouse,
          }),
        ),
        { provide: AuthFacade, useValue: { sucursalId: sucursalId.asReadonly() } },
        {
          provide: InventoryByBranchFacade,
          useValue: {
            selectedInventory: selectedInventory.asReadonly(),
            errorMessage: errorMessage.asReadonly(),
            allItems: allItems.asReadonly(),
            loading: loading.asReadonly(),
            movements: movements.asReadonly(),
            loadMyBranchInventory,
            loadMovements,
            registerMovement,
            refreshAll,
          },
        },
        { provide: ToastService, useValue: { error: toastError, success: toastSuccess } },
      ],
    });

    fixture = TestBed.createComponent(InventoryByBranchPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    dialogOpen.mockRestore();
  });

  function flush(): void {
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  // Comprueba que al iniciar con sucursal se carguen inventario y movimientos.
  it('ngOnInit con sucursal carga inventario y movimientos', () => {
    flush();

    expect(loadMyBranchInventory).toHaveBeenCalledTimes(1);
    expect(loadMovements).toHaveBeenCalledTimes(1);
  });

  // Comprueba que sin sucursal no se dispare ninguna carga y se muestre el aviso.
  it('ngOnInit sin sucursal no carga nada', () => {
    sucursalId.set(null);
    flush();

    expect(loadMyBranchInventory).not.toHaveBeenCalled();
    expect(loadMovements).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Tu usuario no tiene sucursal asignada.',
    );
  });

  // Comprueba que registrar movimiento sin inventario seleccionado falle con toast y sin diálogo.
  it('registrar movimiento sin inventario muestra error', () => {
    flush();

    component.onRegisterMovement(item);

    expect(toastError).toHaveBeenCalledWith('No hay inventario seleccionado');
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  // Comprueba que con inventario seleccionado se abra el diálogo precargado con el producto.
  it('registrar movimiento abre el diálogo con los datos del producto', () => {
    selectedInventory.set(inventory);
    flush();
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onRegisterMovement(item);

    expect(dialogOpen).toHaveBeenCalled();
    const config = dialogOpen.mock.calls[0][1] as { data: Record<string, unknown> };
    expect(config.data).toEqual({
      idInventario: 3,
      idProducto: 7,
      productName: 'Rótula Moog',
      stock: 47,
    });
  });

  // Comprueba que al confirmar el diálogo se registre el movimiento con un único item y se refresque todo.
  it('confirmar el diálogo registra el movimiento y refresca', () => {
    selectedInventory.set(inventory);
    flush();
    dialogOpen.mockReturnValue({
      closed: of({
        idInventario: 3,
        tipoMovimiento: 'SALIDA',
        idProducto: 7,
        cantidad: 2,
        razon: 'Merma',
        observaciones: 'Dañado',
        idProveedor: undefined,
      }),
    } as never);

    component.onRegisterMovement(item);

    expect(registerMovement).toHaveBeenCalledWith({
      idInventario: 3,
      tipoMovimiento: 'SALIDA',
      razon: 'Merma',
      observaciones: 'Dañado',
      idProveedor: undefined,
      items: [{ idProducto: 7, cantidad: 2 }],
    });
    expect(toastSuccess).toHaveBeenCalledWith('Movimiento registrado correctamente');
    expect(refreshAll).toHaveBeenCalledTimes(1);
  });

  // Comprueba que cancelar el diálogo no registre ningún movimiento.
  it('cancelar el diálogo no registra movimiento', () => {
    selectedInventory.set(inventory);
    flush();
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onRegisterMovement(item);

    expect(registerMovement).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  // Comprueba que al fallar el registro no se refresque ni se anuncie éxito (el error lo absorbe la página).
  it('fallar el registro no refresca ni muestra éxito', () => {
    selectedInventory.set(inventory);
    registerMovement.mockReturnValue(throwError(() => new Error('fallo')));
    flush();
    dialogOpen.mockReturnValue({
      closed: of({ idInventario: 3, tipoMovimiento: 'SALIDA', idProducto: 7, cantidad: 1, razon: 'X' }),
    } as never);

    component.onRegisterMovement(item);

    expect(refreshAll).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  // Comprueba que "Registrar Movimiento" general sin selección falle con toast de error.
  it('alta general de movimiento sin inventario muestra error', () => {
    flush();

    component.onAddMovement();

    expect(toastError).toHaveBeenCalledWith('No hay inventario seleccionado');
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  // Comprueba que el alta general use el idInventario del inventario seleccionado.
  it('alta general de movimiento usa el inventario seleccionado', () => {
    selectedInventory.set(inventory);
    flush();
    dialogOpen.mockReturnValue({
      closed: of({ idInventario: 3, tipoMovimiento: 'ENTRADA', idProducto: 9, cantidad: 5, razon: 'Compra' }),
    } as never);

    component.onAddMovement();

    expect(registerMovement).toHaveBeenCalledWith({
      idInventario: 3,
      tipoMovimiento: 'ENTRADA',
      razon: 'Compra',
      observaciones: undefined,
      idProveedor: undefined,
      items: [{ idProducto: 9, cantidad: 5 }],
    });
    expect(toastSuccess).toHaveBeenCalledWith('Movimiento registrado correctamente');
  });

  // Comprueba que un error expuesto por la fachada se muestre como toast vía efecto.
  it('muestra toast cuando la fachada expone un error', () => {
    flush();
    toastError.mockClear();

    errorMessage.set('Stock insuficiente.');
    TestBed.flushEffects();

    expect(toastError).toHaveBeenCalledWith('Stock insuficiente.');
  });
});
