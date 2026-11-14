import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductRepositoryImpl } from './product-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Product, ProductStock } from '@features/inventory/domain/entities/product.entity';
import { ProductResponseDto, ProductStockResponseDto } from '@features/inventory/application/dtos/product-response.dto';

// Unitario: adaptador HTTP aislado con HttpTestingController. Verifica URLs, parámetros y mapeo.
describe('ProductRepositoryImpl', () => {
  let repository: ProductRepositoryImpl;
  let httpMock: HttpTestingController;

  const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };
  const endpoint = 'http://api.test/productos';

  const dto: ProductResponseDto = {
    id: 7,
    id_tipo: 3,
    id_proveedor: null,
    clave: 'SKU-7',
    nombre: 'Rótula',
    descripcion: null,
    codigo_barras: '75010000000007',
    precio_venta: 494.36,
    marca: 'Moog',
    costo: 300.5,
    codigoSAT: null,
  };

  const stockDto: ProductStockResponseDto = {
    ...dto,
    cantidad: 47,
    precio_sucursal: '494.36',
    precio_base: '520.38',
    vigente_desde: null,
    id_sucursal: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(ProductRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Comprueba que getProducts envíe page/page_size y mapee la respuesta a entidades de dominio.
  it('getProducts envía paginación y mapea la respuesta', () => {
    let response: PaginatedResponse<Product> | undefined;
    repository.getProducts({ page: 2, limit: 15 }).subscribe((r) => (response = r));

    const req = httpMock.expectOne(`${endpoint}?page=2&page_size=15`);
    expect(req.request.method).toBe('GET');
    req.flush({ results: [dto], total: 40, page: 2, page_size: 15 });

    expect(response?.data).toHaveLength(1);
    expect(response?.data[0].nombre).toBe('Rótula');
    expect(response?.data[0].precioVenta).toBe(494.36);
    expect(response?.total).toBe(40);
    expect(response?.page).toBe(2);
    expect(response?.limit).toBe(15);
  });

  // Comprueba que sin parámetros no se agregue ningún query string.
  it('getProducts sin params no envía query string', () => {
    repository.getProducts().subscribe();

    const req = httpMock.expectOne(endpoint);
    expect(req.request.params.keys()).toHaveLength(0);
    req.flush({ results: [], total: 0, page: 1, page_size: 15 });
  });

  // Comprueba que con sucursalId se use el mapeo de stock (cantidad y precio de sucursal).
  it('getProducts con sucursalId mapea la variante de stock', () => {
    let response: PaginatedResponse<Product> | undefined;
    repository.getProducts({ page: 1, limit: 15 }, { sucursalId: 1 }).subscribe((r) => (response = r));

    const req = httpMock.expectOne(`${endpoint}?page=1&page_size=15&sucursal_id=1`);
    req.flush({ results: [stockDto], total: 1, page: 1, page_size: 15 });

    const item = response?.data[0] as ProductStock;
    expect(item.cantidad).toBe(47);
    expect(item.precioSucursal).toBe(494.36);
    expect(item.precioBase).toBe(520.38);
  });

  // Comprueba que searchProducts convierta todos los filtros del dominio a parámetros snake_case.
  it('searchProducts convierte query y filtros a parámetros del backend', () => {
    repository
      .searchProducts('bujia', { page: 3, limit: 10 }, {
        sucursalId: 5,
        clave: 'K1',
        marca: 'Moog',
        codigoBarras: '750',
        tipoId: 2,
        proveedorId: 9,
      })
      .subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === endpoint && r.params.get('search') === 'bujia',
    );
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('page_size')).toBe('10');
    expect(req.request.params.get('sucursal_id')).toBe('5');
    expect(req.request.params.get('clave')).toBe('K1');
    expect(req.request.params.get('marca')).toBe('Moog');
    expect(req.request.params.get('codigo_barras')).toBe('750');
    expect(req.request.params.get('tipo_id')).toBe('2');
    expect(req.request.params.get('proveedor_id')).toBe('9');
    req.flush({ results: [dto], total: 1, page: 3, page_size: 10 });
  });

  // Comprueba que la búsqueda con sucursal use también el mapeo de stock.
  it('searchProducts con sucursalId usa el mapeo de stock', () => {
    let response: PaginatedResponse<Product> | undefined;
    repository.searchProducts('rótula', undefined, { sucursalId: 1 }).subscribe((r) => (response = r));

    const req = httpMock.expectOne((r) => r.url === endpoint && r.params.get('search') === 'rótula');
    expect(req.request.params.get('sucursal_id')).toBe('1');
    req.flush({ results: [stockDto], total: 1, page: 1, page_size: 15 });

    expect((response?.data[0] as ProductStock).cantidad).toBe(47);
  });

  // Comprueba que el filtro por categoría viaje como parámetro "categoria".
  it('getProductsByCategoria envía el parámetro categoria', () => {
    repository.getProductsByCategoria('Frenos', { page: 1, limit: 15 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === endpoint && r.params.get('categoria') === 'Frenos');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('page_size')).toBe('15');
    req.flush({ results: [], total: 0, page: 1, page_size: 15 });
  });

  // Comprueba que la consulta por código de barras use el endpoint dedicado con el parámetro esperado.
  it('getByBarcode consulta el endpoint dedicado con codigo_barras', () => {
    repository.getByBarcode('75010000000007').subscribe();

    const req = httpMock.expectOne(
      `${endpoint}/codigo-barras/?codigo_barras=75010000000007`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(dto);
  });

  // Comprueba que createProduct haga POST con el body en snake_case y devuelva la entidad mapeada.
  it('createProduct envía POST en snake_case y mapea la respuesta', () => {
    let created: Product | undefined;
    repository
      .createProduct({
        idTipo: 3,
        idProveedor: null,
        clave: 'SKU-7',
        nombre: 'Rótula',
        descripcion: null,
        codigoBarras: '750',
        precioVenta: 494.36,
        marca: 'Moog',
        costo: 300.5,
        codigoSat: null,
      })
      .subscribe((p) => (created = p));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_tipo: 3,
      id_proveedor: null,
      clave: 'SKU-7',
      nombre: 'Rótula',
      descripcion: null,
      codigo_barras: '750',
      precio_venta: 494.36,
      marca: 'Moog',
      costo: 300.5,
      codigoSAT: null,
    });
    req.flush(dto);

    expect(created?.id).toBe(7);
    expect(created?.nombre).toBe('Rótula');
  });

  // Comprueba que updateProduct haga PUT al recurso del id con el payload parcial.
  it('updateProduct envía PUT al recurso del id', () => {
    repository.updateProduct(7, { nombre: 'Rótula MX', precioVenta: 500 }).subscribe();

    const req = httpMock.expectOne(`${endpoint}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      id_tipo: undefined,
      id_proveedor: undefined,
      clave: undefined,
      nombre: 'Rótula MX',
      descripcion: undefined,
      codigo_barras: undefined,
      precio_venta: 500,
      marca: undefined,
      costo: undefined,
      codigoSAT: undefined,
    });
    req.flush({ ...dto, nombre: 'Rótula MX' });
  });

  // Comprueba que deleteProduct haga DELETE contra el recurso correcto.
  it('deleteProduct envía DELETE al recurso del id', () => {
    repository.deleteProduct(7).subscribe();

    const req = httpMock.expectOne(`${endpoint}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
