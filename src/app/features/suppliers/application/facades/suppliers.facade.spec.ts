import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { SuppliersFacade } from './suppliers.facade';
import { GetSuppliersUseCase } from '../usecase/get-suppliers.usecase';
import { CreateSupplierUseCase } from '../usecase/create-supplier.usecase';
import { UpdateSupplierUseCase } from '../usecase/update-supplier.usecase';
import { DeleteSupplierUseCase } from '../usecase/delete-supplier.usecase';

// H-F3-3: el backend responde {"error": "..."}; la facade debe mostrar ese texto y no "Http failure response...".
describe('SuppliersFacade — mensaje de error del backend (H-F3-3)', () => {
  function setup(updateError: unknown) {
    const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        SuppliersFacade,
        { provide: LoggerService, useValue: { withContext: () => logger } },
        { provide: GetSuppliersUseCase, useValue: { execute: () => of([]) } },
        { provide: CreateSupplierUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateSupplierUseCase, useValue: { execute: () => throwError(() => updateError) } },
        { provide: DeleteSupplierUseCase, useValue: { execute: jest.fn() } },
      ],
    });
    return TestBed.inject(SuppliersFacade);
  }

  it('toma el texto de {error} de la respuesta del back', (done) => {
    const facade = setup(new HttpErrorResponse({ status: 404, error: { error: 'Proveedor con id 9 no encontrado' } }));

    facade.updateSupplier(9, { nombre: 'x' }).subscribe({
      error: () => {
        expect(facade.errorMessage()).toBe('Proveedor con id 9 no encontrado');
        done();
      },
    });
  });
});
