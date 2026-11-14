import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { InventoryRepositoryImpl } from './inventory-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';

// Unitario: adaptador HTTP del inventario por sucursal con HttpTestingController.
describe('InventoryRepositoryImpl', () => {
  let repository: InventoryRepositoryImpl;
  let httpMock: HttpTestingController;

  const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };
  const miSucursalUrl = 'http://api.test/inventarios/mi-sucursal/';
  const inventariosUrl = 'http://api.test/inventarios';

  const itemDto = {
    id: 55,
    id_producto: 7,
    nombre: 'Rótula Moog',
    clave: 'SKU-7',
    marca: 'Moog',
    codigo_barras: '75010000000007',
    precio_venta: '494.36',
    precio_sucursal: '480.00',
    precio_base: '520.38',
    costo: '300.50',
    cantidad: 47,
    vigente_desde: null,
  };

  const inventoryDto = {
    id_inventario: 1,
    descripcion: 'Inventario General',
    id_sucursal: 1,
    detalles: [itemDto],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(InventoryRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Comprueba que una respuesta en arreglo se mapee directamente a entidades de dominio.
  it('getMyBranchInventory mapea una respuesta en arreglo', () => {
    repository.getMyBranchInventory().subscribe((inventories) => {
      expect(inventories).toHaveLength(1);
      expect(inventories[0].idInventario).toBe(1);
      expect(inventories[0].idSucursal).toBe(1);
      expect(inventories[0].detalles[0].precioSucursal).toBe(480);
      expect(inventories[0].detalles[0].cantidad).toBe(47);
    });

    const req = httpMock.expectOne(miSucursalUrl);
    expect(req.request.method).toBe('GET');
    req.flush([inventoryDto]);
  });

  // Comprueba que la forma paginada {results: [...]} también se acepte.
  it('getMyBranchInventory acepta la forma con results', () => {
    repository.getMyBranchInventory().subscribe((inventories) => {
      expect(inventories).toHaveLength(1);
      expect(inventories[0].idInventario).toBe(1);
    });

    httpMock.expectOne(miSucursalUrl).flush({ results: [inventoryDto] });
  });

  // Comprueba que una respuesta de inventario único (objeto con detalles) se envuelva en un arreglo.
  it('getMyBranchInventory envuelve un objeto con detalles en un arreglo', () => {
    repository.getMyBranchInventory().subscribe((inventories) => {
      expect(inventories).toHaveLength(1);
      expect(inventories[0].descripcion).toBe('Inventario General');
    });

    httpMock.expectOne(miSucursalUrl).flush(inventoryDto);
  });

  // Comprueba que una forma de respuesta desconocida produzca una lista vacía (sin excepción).
  it('getMyBranchInventory con forma desconocida devuelve lista vacía', () => {
    repository.getMyBranchInventory().subscribe((inventories) => {
      expect(inventories).toEqual([]);
    });

    httpMock.expectOne(miSucursalUrl).flush({ otra: 'forma' });
  });

  // Comprueba que el listado de inventarios mapee id/descripción/sucursal a camelCase.
  it('getInventarios mapea la lista de inventarios', () => {
    repository.getInventarios().subscribe((list) => {
      expect(list).toEqual([
        { id: 1, descripcion: 'Inventario General', idSucursal: 1 },
        { id: 2, descripcion: 'Almacén', idSucursal: 2 },
      ]);
    });

    const req = httpMock.expectOne(inventariosUrl);
    req.flush([
      { id: 1, descripcion: 'Inventario General', id_sucursal: 1 },
      { id: 2, descripcion: 'Almacén', id_sucursal: 2 },
    ]);
  });

  // Comprueba que crear un inventario haga POST en snake_case y devuelva la entidad mapeada.
  it('createInventario envía POST en snake_case', () => {
    repository.createInventario({ idSucursal: 3, descripcion: 'Nuevo' }).subscribe((inv) => {
      expect(inv).toEqual({ id: 9, descripcion: 'Nuevo', idSucursal: 3 });
    });

    const req = httpMock.expectOne(inventariosUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id_sucursal: 3, descripcion: 'Nuevo' });
    req.flush({ id: 9, descripcion: 'Nuevo', id_sucursal: 3 });
  });
});
