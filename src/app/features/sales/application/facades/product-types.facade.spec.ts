import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { ProductTypesFacade } from './product-types.facade';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { GetProductTypesUseCase } from '@features/sales/product-types/application/usecase/get-product-types.usecase';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import {
  ProductTypeFetchError,
  ProductTypeMutationError,
} from '@features/sales/product-types/domain/errors/product-types.errors';

describe('ProductTypesFacade', () => {
  let facade: ProductTypesFacade;
  const execute = jest.fn<Observable<ProductType[]>, []>();
  const error = jest.fn();

  const types: ProductType[] = [
    { id: 1, nombre: 'Frenos' },
    { id: 2, nombre: 'Motor' },
  ];

  beforeEach(() => {
    execute.mockReset();
    error.mockReset();
    const logger = { error, withContext: () => logger };
    TestBed.configureTestingModule({
      providers: [
        { provide: GetProductTypesUseCase, useValue: { execute } },
        { provide: LOGGER_PORT, useValue: logger },
      ],
    });
    facade = TestBed.inject(ProductTypesFacade);
  });

  // Verifica el estado inicial.
  it('inicia vacío, sin carga y sin error', () => {
    expect(facade.productTypes()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que cargue y exponga las categorías.
  it('carga las categorías y apaga loading', () => {
    execute.mockReturnValue(of(types));

    facade.loadProductTypes();

    expect(facade.productTypes()).toEqual(types);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que loading esté activo mientras la petición está en vuelo.
  it('loading es true mientras la petición está en vuelo', () => {
    const subject = new Subject<ProductType[]>();
    execute.mockReturnValue(subject);

    facade.loadProductTypes();
    expect(facade.loading()).toBe(true);

    subject.next(types);
    subject.complete();
    expect(facade.loading()).toBe(false);
  });

  // Verifica que un error de dominio use su mensaje, deje lista vacía y registre el log.
  it('un ProductTypeFetchError expone su mensaje, lista vacía y log', () => {
    execute.mockReturnValue(throwError(() => new ProductTypeFetchError('Servidor caído')));

    facade.loadProductTypes();

    expect(facade.errorMessage()).toBe('Servidor caído');
    expect(facade.productTypes()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(error).toHaveBeenCalledWith('Failed to load product types', { message: 'Servidor caído' });
  });

  // Verifica que ProductTypeMutationError también use su mensaje.
  it('un ProductTypeMutationError expone su mensaje', () => {
    execute.mockReturnValue(throwError(() => new ProductTypeMutationError('No permitido')));

    facade.loadProductTypes();

    expect(facade.errorMessage()).toBe('No permitido');
  });

  // Verifica que un Error genérico con mensaje lo use.
  it('un Error genérico expone su mensaje', () => {
    execute.mockReturnValue(throwError(() => new Error('boom')));

    facade.loadProductTypes();

    expect(facade.errorMessage()).toBe('boom');
  });

  // Verifica el mensaje por defecto con un error que no es Error o sin mensaje.
  it('un error desconocido o sin mensaje usa el texto por defecto', () => {
    execute.mockReturnValue(throwError(() => 'x'));
    facade.loadProductTypes();
    expect(facade.errorMessage()).toBe('No fue posible cargar las categorias.');

    execute.mockReturnValue(throwError(() => new Error('')));
    facade.loadProductTypes();
    expect(facade.errorMessage()).toBe('No fue posible cargar las categorias.');
  });

  // Verifica que una recarga exitosa limpie el error previo.
  it('una recarga exitosa limpia el error anterior', () => {
    execute.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadProductTypes();
    expect(facade.errorMessage()).toBe('boom');

    execute.mockReturnValue(of(types));
    facade.loadProductTypes();

    expect(facade.errorMessage()).toBeNull();
    expect(facade.productTypes()).toEqual(types);
  });
});
