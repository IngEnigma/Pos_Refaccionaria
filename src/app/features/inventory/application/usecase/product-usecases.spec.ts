import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { GetProductsUseCase } from './get-products.usecase';
import { GetProductsByCategoryUseCase } from './get-products-by-category.usecase';
import { SearchProductsUseCase } from './search-products.usecase';
import { GetProductByBarcodeUseCase } from './get-product-by-barcode.usecase';
import { CreateProductUseCase } from './create-product.usecase';
import { UpdateProductUseCase } from './update-product.usecase';
import { DeleteProductUseCase } from './delete-product.usecase';
import { ProductRepository, CreateProductPayload, ProductSearchParams, UpdateProductPayload } from '@features/inventory/domain/repository/product-repository';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { PaginatedResponse } from '@core/models/pagination.model';

// Unitario: cada caso de uso debe delegar sin lógica extra, salvo el de código de barras
// que normaliza el 404 a null.
describe('Casos de uso del catálogo de productos', () => {
  let repository: {
    getProducts: jest.Mock;
    getProductsByCategoria: jest.Mock;
    searchProducts: jest.Mock;
    getByBarcode: jest.Mock;
    createProduct: jest.Mock;
    updateProduct: jest.Mock;
    deleteProduct: jest.Mock;
  };

  const product: Product = {
    id: 1,
    idTipo: 2,
    idProveedor: null,
    clave: 'SKU-1',
    nombre: 'Filtro',
    descripcion: null,
    codigoBarras: '750',
    precioVenta: 100,
    marca: 'ACME',
    costo: 60,
    codigoSat: null,
  };

  const page: PaginatedResponse<Product> = { data: [product], total: 1, page: 1, limit: 15 };

  beforeEach(() => {
    repository = {
      getProducts: jest.fn(),
      getProductsByCategoria: jest.fn(),
      searchProducts: jest.fn(),
      getByBarcode: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GetProductsUseCase,
        GetProductsByCategoryUseCase,
        SearchProductsUseCase,
        GetProductByBarcodeUseCase,
        CreateProductUseCase,
        UpdateProductUseCase,
        DeleteProductUseCase,
        { provide: ProductRepository, useValue: repository },
      ],
    });
  });

  // Comprueba que GetProductsUseCase pase paginación y searchParams tal cual al repositorio.
  it('GetProductsUseCase delega params y searchParams sin transformar', () => {
    repository.getProducts.mockReturnValue(of(page));
    const params = { page: 2, limit: 15 };
    const searchParams: ProductSearchParams = { sucursalId: 1 };

    let result: PaginatedResponse<Product> | undefined;
    TestBed.inject(GetProductsUseCase).execute(params, searchParams).subscribe((r) => (result = r));

    expect(repository.getProducts).toHaveBeenCalledWith(params, searchParams);
    expect(result).toBe(page);
  });

  // Comprueba que GetProductsByCategoryUseCase pase la categoría y la paginación.
  it('GetProductsByCategoryUseCase delega categoría y params', () => {
    repository.getProductsByCategoria.mockReturnValue(of(page));

    TestBed.inject(GetProductsByCategoryUseCase).execute('Frenos', { page: 1, limit: 15 }).subscribe();

    expect(repository.getProductsByCategoria).toHaveBeenCalledWith('Frenos', { page: 1, limit: 15 });
  });

  // Comprueba que SearchProductsUseCase pase query, paginación y filtros adicionales.
  it('SearchProductsUseCase delega query, params y searchParams', () => {
    repository.searchProducts.mockReturnValue(of(page));
    const searchParams: ProductSearchParams = { marca: 'Moog' };

    TestBed.inject(SearchProductsUseCase).execute('bujia', { page: 3, limit: 15 }, searchParams).subscribe();

    expect(repository.searchProducts).toHaveBeenCalledWith('bujia', { page: 3, limit: 15 }, searchParams);
  });

  // Comprueba que CreateProductUseCase envíe el payload completo al repositorio.
  it('CreateProductUseCase delega el payload de alta', () => {
    repository.createProduct.mockReturnValue(of(product));
    const payload: CreateProductPayload = {
      idTipo: 1,
      idProveedor: null,
      clave: 'K',
      nombre: 'N',
      descripcion: null,
      codigoBarras: '750',
      precioVenta: 10,
      marca: 'M',
      costo: 5,
      codigoSat: null,
    };

    let created: Product | undefined;
    TestBed.inject(CreateProductUseCase).execute(payload).subscribe((p) => (created = p));

    expect(repository.createProduct).toHaveBeenCalledWith(payload);
    expect(created).toBe(product);
  });

  // Comprueba que UpdateProductUseCase pase id y payload sin alterarlos.
  it('UpdateProductUseCase delega id y payload', () => {
    repository.updateProduct.mockReturnValue(of(product));
    const payload: UpdateProductPayload = { nombre: 'X' };

    TestBed.inject(UpdateProductUseCase).execute(9, payload).subscribe();

    expect(repository.updateProduct).toHaveBeenCalledWith(9, payload);
  });

  // Comprueba que DeleteProductUseCase delege únicamente el id.
  it('DeleteProductUseCase delega el id', () => {
    repository.deleteProduct.mockReturnValue(of(undefined));

    TestBed.inject(DeleteProductUseCase).execute(4).subscribe();

    expect(repository.deleteProduct).toHaveBeenCalledWith(4);
  });

  // Comprueba que la búsqueda por código de barras devuelva el producto cuando existe.
  it('GetProductByBarcodeUseCase devuelve el producto cuando existe', () => {
    repository.getByBarcode.mockReturnValue(of(product));

    let result: Product | null | undefined;
    TestBed.inject(GetProductByBarcodeUseCase).execute('750').subscribe((p) => (result = p));

    expect(repository.getByBarcode).toHaveBeenCalledWith('750');
    expect(result).toBe(product);
  });

  // Comprueba que un 404 del backend se traduzca en null (producto inexistente, no error).
  it('GetProductByBarcodeUseCase convierte un 404 en null', () => {
    repository.getByBarcode.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    let result: Product | null | undefined = product;
    TestBed.inject(GetProductByBarcodeUseCase).execute('inexistente').subscribe((p) => (result = p));

    expect(result).toBeNull();
  });

  // Comprueba que un error distinto de 404 se propague en lugar de tragárselo.
  it('GetProductByBarcodeUseCase propaga errores distintos de 404', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    repository.getByBarcode.mockReturnValue(throwError(() => error));

    let propagated: unknown;
    TestBed.inject(GetProductByBarcodeUseCase).execute('750').subscribe({ error: (e: unknown) => (propagated = e) });

    expect(propagated).toBe(error);
  });
});
