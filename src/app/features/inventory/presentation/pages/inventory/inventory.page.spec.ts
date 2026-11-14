import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, importProvidersFrom } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { LucideAngularModule, Package, Pencil, Tag, Trash2, Plus } from 'lucide-angular';

import { InventoryPageComponent } from './inventory.page';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryFacade } from '@features/inventory/application/facades/inventory.facade';
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { BranchPricingFacade } from '@features/branch-pricing/application/facades/branch-pricing.facade';
import { ProductTypesFacade } from '@features/sales';
import { GlobalSearchService } from '@core/search/global-search.service';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';
import { Product } from '@features/inventory/domain/entities/product.entity';

// Unitario: lógica propia de la página de catálogo (filtrado, paginación cliente,
// recarga y alta/baja/edición) con todas las fachadas sustituidas por stubs.
describe('InventoryPageComponent (catálogo)', () => {
  let fixture: ComponentFixture<InventoryPageComponent>;
  let component: InventoryPageComponent;

  let sucursalId: ReturnType<typeof signal<number | null>>;
  let searchQuery: ReturnType<typeof signal<string>>;
  let branchLoading: ReturnType<typeof signal<boolean>>;
  let branchError: ReturnType<typeof signal<string | null>>;
  let branchItems: ReturnType<typeof signal<readonly InventoryItem[]>>;
  let typesError: ReturnType<typeof signal<string | null>>;
  let loadMyBranchInventory: jest.Mock;
  let loadProductTypes: jest.Mock;
  let deleteProduct: jest.Mock;
  let updateProduct: jest.Mock;
  let createProduct: jest.Mock;
  let setBranchPrice: jest.Mock;
  let toastError: jest.Mock;
  let toastSuccess: jest.Mock;
  let dialogOpen: jest.SpyInstance;

  const makeItem = (productoId: number, overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: productoId * 10,
    idProducto: productoId,
    nombre: `Producto ${productoId}`,
    clave: `K${productoId}`,
    marca: 'Marca',
    codigoBarras: `750${productoId}`,
    precioVenta: 100,
    precioSucursal: null,
    precioBase: 100,
    costo: 50,
    cantidad: 10,
    vigenteDesde: null,
    ...overrides,
  });

  // Cambia la señal de búsqueda y fuerza el flush de los efectos de la página.
  function changeSearch(query: string): void {
    searchQuery.set(query);
    TestBed.flushEffects();
  }

  beforeEach(() => {
    sucursalId = signal<number | null>(1);
    searchQuery = signal('');
    branchLoading = signal(false);
    branchError = signal<string | null>(null);
    branchItems = signal<readonly InventoryItem[]>([]);
    typesError = signal<string | null>(null);
    loadMyBranchInventory = jest.fn();
    loadProductTypes = jest.fn();
    deleteProduct = jest.fn(() => of(undefined));
    updateProduct = jest.fn(() => of({} as Product));
    createProduct = jest.fn(() => of({} as Product));
    setBranchPrice = jest.fn(() => of({}));
    toastError = jest.fn();
    toastSuccess = jest.fn();
    // El DialogModule del template provee un Dialog real que pisa al stub del TestBed;
    // se usa un spy de prototipo para interceptar dialog.open sin alterar la página.
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');

    TestBed.configureTestingModule({
      providers: [
        // Iconos lucide del template (tarjetas y botón Añadir); sin ellos el render lanza error.
        importProvidersFrom(LucideAngularModule.pick({ Package, Pencil, Tag, Trash2, Plus })),
        { provide: AuthFacade, useValue: { sucursalId: sucursalId.asReadonly() } },
        {
          provide: ProductTypesFacade,
          useValue: {
            loading: () => false,
            productTypes: () => [{ id: 1, nombre: 'Frenos' }],
            errorMessage: typesError.asReadonly(),
            loadProductTypes,
          },
        },
        {
          provide: InventoryFacade,
          useValue: {
            errorMessage: branchError.asReadonly(),
            createProduct,
            updateProduct,
            deleteProduct,
          },
        },
        {
          provide: InventoryByBranchFacade,
          useValue: {
            loading: branchLoading.asReadonly(),
            allItems: branchItems.asReadonly(),
            errorMessage: signal<string | null>(null).asReadonly(),
            loadMyBranchInventory,
          },
        },
        {
          provide: BranchPricingFacade,
          useValue: {
            errorMessage: signal<string | null>(null).asReadonly(),
            setBranchPrice,
          },
        },
        {
          provide: GlobalSearchService,
          useValue: { searchQuery: searchQuery.asReadonly() },
        },
        { provide: ToastService, useValue: { error: toastError, success: toastSuccess } },
      ],
    });

    fixture = TestBed.createComponent(InventoryPageComponent);
    component = fixture.componentInstance;
    // Shim de entorno: jsdom no expone IntersectionObserver (lo usa el grid).
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = class {
      observe = jest.fn();
      disconnect = jest.fn();
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['IntersectionObserver'];
    dialogOpen.mockRestore();
  });

  function flush(): void {
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  // Comprueba que al iniciar con sucursal se carguen categorías e inventario de la sucursal.
  it('ngOnInit con sucursal carga tipos e inventario', () => {
    flush();

    expect(loadProductTypes).toHaveBeenCalled();
    expect(loadMyBranchInventory).toHaveBeenCalled();
  });

  // Comprueba que sin sucursal asignada no se solicite el inventario.
  it('ngOnInit sin sucursal no carga el inventario', () => {
    sucursalId.set(null);
    flush();

    expect(loadMyBranchInventory).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Tu usuario no tiene sucursal asignada.',
    );
  });

  // Comprueba que sin búsqueda el listado muestre todos los items del inventario.
  it('sin búsqueda muestra todos los items', () => {
    branchItems.set([makeItem(1), makeItem(2), makeItem(3)]);
    flush();

    expect(component.totalItems()).toBe(3);
    expect(component.paginatedProducts()).toHaveLength(3);
  });

  // Comprueba que la búsqueda filtre por nombre, clave, código de barras y marca sin distinguir mayúsculas.
  it('la búsqueda filtra por nombre, clave, código y marca', () => {
    branchItems.set([
      makeItem(1, { nombre: 'Rótula Moog' }),
      makeItem(2, { clave: 'AMORT-10' }),
      makeItem(3, { codigoBarras: '750999' }),
      makeItem(4, { marca: 'Brembo' }),
      makeItem(5, { nombre: 'Filtro' }),
    ]);
    flush();

    changeSearch('rótula');
    expect(component.filteredItems().map((i) => i.idProducto)).toEqual([1]);

    changeSearch('amort');
    expect(component.filteredItems().map((i) => i.idProducto)).toEqual([2]);

    changeSearch('750999');
    expect(component.filteredItems().map((i) => i.idProducto)).toEqual([3]);

    changeSearch('BREMBO');
    expect(component.filteredItems().map((i) => i.idProducto)).toEqual([4]);

    changeSearch('zzz'); // consulta sin coincidencias -> vacío
    expect(component.filteredItems()).toEqual([]);
  });

  // Comprueba que la paginación cliente muestre solo pageSize ítems y ofrezca "cargar más".
  it('paginación cliente limita a 15 y permite cargar más', () => {
    const many = Array.from({ length: 20 }, (_, i) => makeItem(i + 1));
    branchItems.set(many);
    flush();

    expect(component.paginatedProducts()).toHaveLength(15);
    expect(component.hasMore()).toBe(true);

    component.onLoadMore();

    expect(component.paginatedProducts()).toHaveLength(20);
    expect(component.hasMore()).toBe(false);
  });

  // Comprueba que al cambiar la búsqueda se resetee la página a 1.
  it('cambiar la búsqueda restablece la página', () => {
    branchItems.set(Array.from({ length: 20 }, (_, i) => makeItem(i + 1)));
    flush();
    component.onLoadMore();
    expect(component.currentPage()).toBe(2);

    changeSearch('Producto');

    expect(component.currentPage()).toBe(1);
  });

  // Comprueba que elegir una categoría resetee la paginación (el filtrado por tipo no aplica a InventoryItem).
  it('seleccionar categoría restablece la página', () => {
    branchItems.set(Array.from({ length: 20 }, (_, i) => makeItem(i + 1)));
    flush();
    component.onLoadMore();

    component.onSelectCategory({ id: 1, nombre: 'Frenos' });

    expect(component.currentPage()).toBe(1);
    expect(component.selectedCategoryId()).toBe(1);
  });

  // Comprueba que recargar productos vuelva a la página 1 y reconsulte mi-sucursal.
  it('reloadProducts resetea la página y recarga', () => {
    flush();
    component.onLoadMore();
    loadMyBranchInventory.mockClear();

    component.reloadProducts();

    expect(component.currentPage()).toBe(1);
    expect(loadMyBranchInventory).toHaveBeenCalled();
  });

  // Comprueba que los errores de las fachadas del catálogo se muestren como toast de error.
  it('muestra toast de error cuando la fachada de inventario reporta fallo', () => {
    flush();
    toastError.mockClear();

    branchError.set('No fue posible leer el inventario.');
    TestBed.flushEffects();

    expect(toastError).toHaveBeenCalledWith('No fue posible leer el inventario.');
  });

  // Comprueba que un estado vacío muestre el mensaje de "sin productos".
  it('muestra estado vacío cuando no hay productos', () => {
    branchItems.set([]);
    flush();

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).toContain('Sin productos en tu sucursal');
  });

  // Comprueba que confirmar la eliminación invoque deleteProduct y recargue el inventario.
  it('confirmar eliminar invoca deleteProduct y recarga', () => {
    branchItems.set([makeItem(7)]);
    flush();
    loadMyBranchInventory.mockClear(); // aisla la llamada de la recarga posterior
    dialogOpen.mockReturnValue({ closed: of(true) } as never);

    component.onDeleteProduct(branchItems()[0]);

    expect(dialogOpen).toHaveBeenCalled();
    expect(deleteProduct).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Producto eliminado correctamente');
    expect(loadMyBranchInventory).toHaveBeenCalledTimes(1);
  });

  // Comprueba que cancelar la eliminación no invoque deleteProduct.
  it('cancelar eliminar no borra nada', () => {
    branchItems.set([makeItem(7)]);
    flush();
    dialogOpen.mockReturnValue({ closed: of(false) } as never);

    component.onDeleteProduct(branchItems()[0]);

    expect(deleteProduct).not.toHaveBeenCalled();
  });

  // EVIDENCIA BUG: el producto del grid es InventoryItem, cuyo "id" es la fila de detalle de
  // inventario y NO el idProducto; la página usa "id ?? idProducto" y por eso envía el id del
  // detalle a DELETE /productos/{id}. Debería enviarse idProducto (7), no el id de detalle (70).
  it('BUG: eliminar usa el id del detalle en lugar del idProducto', () => {
    const item = makeItem(7); // id detalle = 70, idProducto = 7
    branchItems.set([item]);
    flush();
    dialogOpen.mockReturnValue({ closed: of(true) } as never);

    component.onDeleteProduct(item);

    expect(deleteProduct).toHaveBeenCalledWith(70);
    // Comportamiento correcto esperado (hoy fallaría): expect(deleteProduct).toHaveBeenCalledWith(7);
  });

  // EVIDENCIA BUG: al editar, el diálogo recibe el producto mapeado con id=idProducto, pero la
  // petición de actualización usa el id del detalle de inventario (70) en lugar de idProducto (7).
  it('BUG: actualizar usa el id del detalle en lugar del idProducto', () => {
    const item = makeItem(7);
    branchItems.set([item]);
    flush();
    dialogOpen.mockReturnValue({ closed: of({ nombre: 'X' }) } as never);

    component.onModifyProduct(item);

    // El diálogo sí recibe el producto correcto (idProducto)...
    const dialogData = dialogOpen.mock.calls[0][1] as { data: { product: Product } };
    expect(dialogData.data.product.id).toBe(7);
    // ...pero la actualización se dispara con el id del detalle (comportamiento bug).
    expect(updateProduct).toHaveBeenCalledWith(70, { nombre: 'X' });
  });

  // Comprueba que sin sucursal asignada el cambio de precio se rechace con toast de error.
  it('cambiar precio sin sucursal muestra error', () => {
    sucursalId.set(null);
    flush();

    component.onChangePrice(makeItem(7));

    expect(toastError).toHaveBeenCalledWith('No hay sucursal asignada para cambiar precio');
    expect(dialogOpen).not.toHaveBeenCalled();
  });

  // Comprueba que con sucursal el cambio de precio abra el diálogo y al confirmar recargue el inventario.
  it('cambiar precio con sucursal confirma y recarga', () => {
    flush();
    loadMyBranchInventory.mockClear(); // aisla la llamada de la recarga posterior
    dialogOpen.mockReturnValue({ closed: of({ idProducto: 7, idSucursal: 1, precio: 500 }) } as never);

    component.onChangePrice(makeItem(7));

    expect(dialogOpen).toHaveBeenCalled();
    expect(setBranchPrice).toHaveBeenCalledWith({ idProducto: 7, idSucursal: 1, precio: 500 });
    expect(toastSuccess).toHaveBeenCalledWith('Precio de sucursal actualizado correctamente');
    expect(loadMyBranchInventory).toHaveBeenCalledTimes(1);
  });
});
