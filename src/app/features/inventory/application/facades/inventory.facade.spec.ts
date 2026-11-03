import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { InventoryFacade } from './inventory.facade';
import { GetProductsUseCase } from '../usecase/get-products.usecase';
import { GetProductsByCategoryUseCase } from '../usecase/get-products-by-category.usecase';
import { SearchProductsUseCase } from '../usecase/search-products.usecase';
import { GetProductByBarcodeUseCase } from '../usecase/get-product-by-barcode.usecase';
import { CreateProductUseCase } from '../usecase/create-product.usecase';
import { UpdateProductUseCase } from '../usecase/update-product.usecase';
import { DeleteProductUseCase } from '../usecase/delete-product.usecase';
import { LoggerService } from '@core/logging/logger.service';
import { PaginatedResponse } from '@core/models/pagination.model';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { CreateProductPayload, UpdateProductPayload } from '@features/inventory/domain/repository/product-repository';

// Unitario: facade con los 7 casos de uso reemplazados por stubs. No hay HTTP.
describe('InventoryFacade', () => {
  let facade: InventoryFacade;
  let getProductsUseCase: { execute: jest.Mock };
  let getProductsByCategoryUseCase: { execute: jest.Mock };
  let searchProductsUseCase: { execute: jest.Mock };
  let getProductByBarcodeUseCase: { execute: jest.Mock };
  let createProductUseCase: { execute: jest.Mock };
  let updateProductUseCase: { execute: jest.Mock };
  let deleteProductUseCase: { execute: jest.Mock };

  const makeProduct = (id: number): Product => ({
    id,
    idTipo: 1,
    idProveedor: null,
    clave: `SKU-${id}`,
    nombre: `Producto ${id}`,
    descripcion: null,
    codigoBarras: `75000000000${id}`,
    precioVenta: 100,
    marca: 'Marca',
    costo: 50,
    codigoSat: null,
  });

  const makePage = (
    data: Product[],
    total = data.length,
    page = 1,
    limit = 15,
  ): PaginatedResponse<Product> => ({ data, total, page, limit });

  beforeEach(() => {
    getProductsUseCase = { execute: jest.fn() };
    getProductsByCategoryUseCase = { execute: jest.fn() };
    searchProductsUseCase = { execute: jest.fn() };
    getProductByBarcodeUseCase = { execute: jest.fn() };
    createProductUseCase = { execute: jest.fn() };
    updateProductUseCase = { execute: jest.fn() };
    deleteProductUseCase = { execute: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        InventoryFacade,
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
        { provide: GetProductsByCategoryUseCase, useValue: getProductsByCategoryUseCase },
        { provide: SearchProductsUseCase, useValue: searchProductsUseCase },
        { provide: GetProductByBarcodeUseCase, useValue: getProductByBarcodeUseCase },
        { provide: CreateProductUseCase, useValue: createProductUseCase },
        { provide: UpdateProductUseCase, useValue: updateProductUseCase },
        { provide: DeleteProductUseCase, useValue: deleteProductUseCase },
        {
          provide: LoggerService,
          useValue: { withContext: jest.fn().mockReturnValue({ error: jest.fn(), warn: jest.fn() }) },
        },
      ],
    });

    facade = TestBed.inject(InventoryFacade);
  });

  // Comprueba que antes de cualquier carga el catálogo esté vacío y sin errores.
  it('inicia con el estado vacío por defecto', () => {
    expect(facade.products()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.totalItems()).toBe(0);
    expect(facade.currentPage()).toBe(1);
    expect(facade.pageSize()).toBe(15);
    expect(facade.productFilter()).toEqual({ type: 'all' });
  });

  // Comprueba que loadProducts delegue en GetProductsUseCase con paginación y refleje la respuesta en los signals.
  it('loadProducts carga la página indicada y actualiza el estado', () => {
    getProductsUseCase.execute.mockReturnValue(of(makePage([makeProduct(1), makeProduct(2)], 2, 1, 15)));

    facade.loadProducts(1);

    expect(getProductsUseCase.execute).toHaveBeenCalledWith({ page: 1, limit: 15 }, undefined);
    expect(facade.products()).toHaveLength(2);
    expect(facade.totalItems()).toBe(2);
    expect(facade.currentPage()).toBe(1);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.productFilter()).toEqual({ type: 'all' });
  });

  // Comprueba que sin append se vacíe la lista de inmediato y quede loading mientras la respuesta no llega.
  it('loadProducts sin append limpia la lista y marca loading durante la espera', () => {
    getProductsUseCase.execute.mockReturnValue(of(makePage([makeProduct(1)])));
    facade.loadProducts(1);
    expect(facade.products()).toHaveLength(1);

    // Observable que nunca emite: permite observar el estado intermedio.
    getProductsUseCase.execute.mockReturnValue(new Observable(() => undefined));

    facade.loadProducts(1);

    expect(facade.products()).toEqual([]);
    expect(facade.totalItems()).toBe(0);
    expect(facade.loading()).toBe(true);
  });

  // Comprueba que durante la carga el signal de loading esté encendido (se verifica dentro del stub).
  it('loadProducts enciende loading mientras obtiene los datos', () => {
    getProductsUseCase.execute.mockImplementation(() => {
      expect(facade.loading()).toBe(true);
      return of(makePage([makeProduct(1)]));
    });

    facade.loadProducts(1);

    expect(facade.loading()).toBe(false);
  });

  // Comprueba que con append=true se concatene la nueva página a los productos ya cargados.
  it('loadProducts con append concatena la siguiente página', () => {
    getProductsUseCase.execute.mockReturnValueOnce(of(makePage([makeProduct(1)], 3, 1, 15)));
    facade.loadProducts(1);

    getProductsUseCase.execute.mockReturnValueOnce(of(makePage([makeProduct(2), makeProduct(3)], 3, 2, 15)));
    facade.loadProducts(2, true);

    expect(facade.products().map((p) => p.id)).toEqual([1, 2, 3]);
    expect(facade.currentPage()).toBe(2);
    expect(facade.totalItems()).toBe(3);
  });

  // Comprueba que el filtro por categoría use su caso de uso y quede registrado en productFilter.
  it('loadProductsByCategoria usa el caso de uso de categoría y guarda el filtro', () => {
    getProductsByCategoryUseCase.execute.mockReturnValue(of(makePage([makeProduct(9)], 1, 2, 15)));

    facade.loadProductsByCategoria('Frenos', 2);

    expect(getProductsByCategoryUseCase.execute).toHaveBeenCalledWith('Frenos', { page: 2, limit: 15 });
    expect(facade.productFilter()).toEqual({ type: 'category', categoryName: 'Frenos' });
    expect(facade.products()).toHaveLength(1);
  });

  // Comprueba que una búsqueda en blanco regrese al listado "todos" sin invocar el caso de búsqueda.
  it('searchProducts con consulta vacía restablece el listado completo', () => {
    getProductsUseCase.execute.mockReturnValue(of(makePage([makeProduct(1)])));

    facade.searchProducts('   ');

    expect(getProductsUseCase.execute).toHaveBeenCalledWith({ page: 1, limit: 15 }, undefined);
    expect(searchProductsUseCase.execute).not.toHaveBeenCalled();
    expect(facade.productFilter()).toEqual({ type: 'all' });
  });

  // Comprueba que la búsqueda con texto delegue query, paginación y searchParams en SearchProductsUseCase.
  it('searchProducts con consulta delega en el caso de búsqueda con searchParams', () => {
    searchProductsUseCase.execute.mockReturnValue(of(makePage([makeProduct(4)], 1, 3, 15)));

    facade.searchProducts('filtro', 3, false, { sucursalId: 7 });

    expect(searchProductsUseCase.execute).toHaveBeenCalledWith('filtro', { page: 3, limit: 15 }, { sucursalId: 7 });
    expect(facade.productFilter()).toEqual({ type: 'search', query: 'filtro' });
    expect(facade.products()).toHaveLength(1);
  });

  // Comprueba que un error HTTP deje mensaje, lista vacía y loading apagado.
  it('ante error al cargar expone el mensaje, limpia la lista y apaga loading', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    getProductsUseCase.execute.mockReturnValue(throwError(() => error));

    facade.loadProducts(1);

    expect(facade.errorMessage()).toBe(error.message);
    expect(facade.products()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que un error que no es Error ni HttpErrorResponse use el mensaje genérico del facade.
  it('ante un error sin mensaje se usa el texto genérico', () => {
    getProductsUseCase.execute.mockReturnValue(throwError(() => ({ unexpected: true })));

    facade.loadProducts(1);

    expect(facade.errorMessage()).toBe('No fue posible cargar los productos.');
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que un Error simple exponga su message como mensaje de error.
  it('ante un Error se expone su message', () => {
    getProductsUseCase.execute.mockReturnValue(throwError(() => new Error('boom')));

    facade.loadProducts(1);

    expect(facade.errorMessage()).toBe('boom');
  });

  // Comprueba que loadMore pida la siguiente página solo cuando quedan productos por cargar.
  it('loadMore pide la siguiente página cuando faltan productos', () => {
    getProductsUseCase.execute.mockReturnValueOnce(of(makePage([makeProduct(1)], 30, 1, 15)));
    facade.loadProducts(1);

    getProductsUseCase.execute.mockReturnValueOnce(of(makePage([makeProduct(2)], 30, 2, 15)));
    facade.loadMore();

    expect(getProductsUseCase.execute).toHaveBeenLastCalledWith({ page: 2, limit: 15 }, undefined);
    expect(facade.products()).toHaveLength(2);
  });

  // Comprueba que loadMore no haga ninguna petición cuando ya se cargó todo.
  it('loadMore no hace nada cuando ya se cargaron todos los productos', () => {
    getProductsUseCase.execute.mockReturnValue(of(makePage([makeProduct(1), makeProduct(2)], 2, 1, 15)));
    facade.loadProducts(1);
    getProductsUseCase.execute.mockClear();

    facade.loadMore();

    expect(getProductsUseCase.execute).not.toHaveBeenCalled();
  });

  // Comprueba que deleteProduct delegue el id y gestione loading durante y después de la operación.
  it('deleteProduct delega el id y gestiona loading', () => {
    deleteProductUseCase.execute.mockImplementation(() => {
      expect(facade.loading()).toBe(true);
      return of(undefined);
    });

    facade.deleteProduct(5).subscribe();

    expect(deleteProductUseCase.execute).toHaveBeenCalledWith(5);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que al fallar deleteProduct se exponga el mensaje y el error se propague al suscriptor.
  it('deleteProduct con error expone el mensaje y propaga el error', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    deleteProductUseCase.execute.mockReturnValue(throwError(() => error));

    let propagated: unknown;
    facade.deleteProduct(5).subscribe({ error: (e: unknown) => (propagated = e) });

    expect(propagated).toBe(error);
    expect(facade.errorMessage()).toBe(error.message);
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que createProduct con error deje mensaje y propague el fallo al suscriptor.
  it('createProduct con error expone el mensaje y propaga el error', () => {
    const error = new HttpErrorResponse({ status: 400, statusText: 'Bad Request' });
    createProductUseCase.execute.mockReturnValue(throwError(() => error));

    const payload: CreateProductPayload = {
      idTipo: 1,
      idProveedor: null,
      clave: 'K1',
      nombre: 'Producto',
      descripcion: null,
      codigoBarras: '750',
      precioVenta: 10,
      marca: 'M',
      costo: 5,
      codigoSat: null,
    };

    let propagated: unknown;
    facade.createProduct(payload).subscribe({ error: (e: unknown) => (propagated = e) });

    expect(createProductUseCase.execute).toHaveBeenCalledWith(payload);
    expect(propagated).toBe(error);
    expect(facade.errorMessage()).toBe(error.message);
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que createProduct exitoso no deje mensaje de error.
  it('createProduct exitoso limpia el estado de error', () => {
    createProductUseCase.execute.mockReturnValue(of(makeProduct(77)));

    let created: Product | undefined;
    facade
      .createProduct({
        idTipo: 1,
        idProveedor: null,
        clave: 'K2',
        nombre: 'Nuevo',
        descripcion: null,
        codigoBarras: '751',
        precioVenta: 10,
        marca: 'M',
        costo: 5,
        codigoSat: null,
      })
      .subscribe((p) => (created = p));

    expect(created?.id).toBe(77);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que updateProduct delegue id y payload sin transformaciones.
  it('updateProduct delega id y payload al caso de uso', () => {
    updateProductUseCase.execute.mockReturnValue(of(makeProduct(3)));

    const payload: UpdateProductPayload = { nombre: 'Actualizado', precioVenta: 150 };
    facade.updateProduct(3, payload).subscribe();

    expect(updateProductUseCase.execute).toHaveBeenCalledWith(3, payload);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que la consulta por código de barras se delegue tal cual al caso de uso.
  it('getProductByBarcode delega el código de barras', () => {
    getProductByBarcodeUseCase.execute.mockReturnValue(of(makeProduct(10)));

    facade.getProductByBarcode('750123').subscribe();

    expect(getProductByBarcodeUseCase.execute).toHaveBeenCalledWith('750123');
  });
});
