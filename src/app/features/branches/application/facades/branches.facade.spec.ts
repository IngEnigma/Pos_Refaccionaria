import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { CreateBranchUseCase } from '../usecase/create-branch.usecase';
import { DeleteBranchUseCase } from '../usecase/delete-branch.usecase';
import { GetBranchesUseCase } from '../usecase/get-branches.usecase';
import { UpdateBranchUseCase } from '../usecase/update-branch.usecase';
import { BranchesFacade } from './branches.facade';

describe('BranchesFacade', () => {
  const branch: Branch = {
    id: 1,
    nombreSucursal: 'Centro',
    codigoSucursal: 'SUC-001',
    ubicacion: 'Calle 1',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  const createPayload: CreateBranchPayload = {
    nombreSucursal: 'Centro',
    ubicacion: 'Calle 1',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  const updatePayload: UpdateBranchPayload = { nombreSucursal: 'Centro 2' };

  let getBranches: jest.Mock;
  let createBranch: jest.Mock;
  let updateBranch: jest.Mock;
  let deleteBranch: jest.Mock;
  let logger: { error: jest.Mock };
  let facade: BranchesFacade;

  beforeEach(() => {
    getBranches = jest.fn();
    createBranch = jest.fn();
    updateBranch = jest.fn();
    deleteBranch = jest.fn();
    logger = { error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: GetBranchesUseCase, useValue: { execute: getBranches } },
        { provide: CreateBranchUseCase, useValue: { execute: createBranch } },
        { provide: UpdateBranchUseCase, useValue: { execute: updateBranch } },
        { provide: DeleteBranchUseCase, useValue: { execute: deleteBranch } },
        { provide: LoggerService, useValue: { withContext: () => logger } },
      ],
    });
    facade = TestBed.inject(BranchesFacade);
  });

  it('arranca con lista vacía, sin loading y sin error', () => {
    expect(facade.branches()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  describe('loadBranches', () => {
    it('publica las sucursales y apaga loading', () => {
      getBranches.mockReturnValue(of([branch]));

      facade.loadBranches();

      expect(facade.branches()).toEqual([branch]);
      expect(facade.loading()).toBe(false);
      expect(facade.errorMessage()).toBeNull();
    });

    it('mantiene loading encendido mientras la petición sigue en curso', () => {
      const pending = new Subject<Branch[]>();
      getBranches.mockReturnValue(pending);

      facade.loadBranches();
      expect(facade.loading()).toBe(true);

      pending.next([branch]);
      pending.complete();
      expect(facade.loading()).toBe(false);
    });

    it('deja la lista vacía, expone el error y lo registra si falla', () => {
      getBranches.mockReturnValue(throwError(() => new Error('boom')));

      facade.loadBranches();

      expect(facade.branches()).toEqual([]);
      expect(facade.errorMessage()).toBe('boom');
      expect(facade.loading()).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to load branches', { message: 'boom' });
    });

    it('limpia el error previo al recargar con éxito', () => {
      getBranches.mockReturnValueOnce(throwError(() => new Error('boom')));
      facade.loadBranches();
      expect(facade.errorMessage()).toBe('boom');
      getBranches.mockReturnValueOnce(of([branch]));

      facade.loadBranches();

      expect(facade.errorMessage()).toBeNull();
      expect(facade.branches()).toEqual([branch]);
    });
  });

  describe('resolución del mensaje de error', () => {
    const failLoad = (error: unknown): void => {
      getBranches.mockReturnValue(throwError(() => error));
      facade.loadBranches();
    };

    it('usa error.error.message cuando el HttpErrorResponse lo trae', () => {
      failLoad(new HttpErrorResponse({ status: 400, error: { message: 'Correo inválido' } }));

      expect(facade.errorMessage()).toBe('Correo inválido');
    });

    it('cae al message del HttpErrorResponse si el cuerpo no trae message', () => {
      const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error', error: { detail: 'x' } });

      failLoad(httpError);

      expect(facade.errorMessage()).toBe(httpError.message);
    });

    it('usa el mensaje genérico de operación si el HttpErrorResponse no trae ningún texto', () => {
      const httpError = new HttpErrorResponse({ status: 500 });
      Object.defineProperty(httpError, 'message', { value: '' });

      failLoad(httpError);

      expect(facade.errorMessage()).toBe('No fue posible completar la operación.');
    });

    it('usa el message de un Error común', () => {
      failLoad(new Error('falla local'));

      expect(facade.errorMessage()).toBe('falla local');
    });

    it('usa el mensaje inesperado para un Error sin message', () => {
      failLoad(new Error(''));

      expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
    });

    it('usa el mensaje inesperado para un valor que no es Error', () => {
      failLoad('texto suelto');

      expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
    });
  });

  describe('createBranch', () => {
    it('delega en el use case, devuelve la sucursal creada y apaga loading', () => {
      createBranch.mockReturnValue(of(branch));
      let created: Branch | undefined;

      facade.createBranch(createPayload).subscribe((result) => (created = result));

      expect(created).toEqual(branch);
      expect(createBranch).toHaveBeenCalledWith(createPayload);
      expect(facade.loading()).toBe(false);
    });

    it('enciende loading y limpia el error al iniciar', () => {
      const pending = new Subject<Branch>();
      createBranch.mockReturnValue(pending);
      getBranches.mockReturnValue(throwError(() => new Error('previo')));
      facade.loadBranches();

      facade.createBranch(createPayload).subscribe();

      expect(facade.loading()).toBe(true);
      expect(facade.errorMessage()).toBeNull();
    });

    it('expone el error, lo registra con el payload, lo relanza y apaga loading', () => {
      const error = new Error('sucursal duplicada');
      createBranch.mockReturnValue(throwError(() => error));
      let caught: unknown;

      facade.createBranch(createPayload).subscribe({ error: (err) => (caught = err) });

      expect(caught).toBe(error);
      expect(facade.errorMessage()).toBe('sucursal duplicada');
      expect(facade.loading()).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to create branch', {
        message: 'sucursal duplicada',
        payload: createPayload,
      });
    });
  });

  describe('updateBranch', () => {
    it('delega en el use case con id y payload, devuelve la sucursal actualizada y apaga loading', () => {
      const updated = { ...branch, nombreSucursal: 'Centro 2' };
      updateBranch.mockReturnValue(of(updated));
      let result: Branch | undefined;

      facade.updateBranch(1, updatePayload).subscribe((value) => (result = value));

      expect(result).toEqual(updated);
      expect(updateBranch).toHaveBeenCalledWith(1, updatePayload);
      expect(facade.loading()).toBe(false);
    });

    it('expone el error, lo registra con id y payload, lo relanza y apaga loading', () => {
      const error = new HttpErrorResponse({ status: 404, error: { message: 'No existe' } });
      updateBranch.mockReturnValue(throwError(() => error));
      let caught: unknown;

      facade.updateBranch(1, updatePayload).subscribe({ error: (err) => (caught = err) });

      expect(caught).toBe(error);
      expect(facade.errorMessage()).toBe('No existe');
      expect(facade.loading()).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to update branch', {
        message: 'No existe',
        id: 1,
        payload: updatePayload,
      });
    });
  });

  describe('deleteBranch', () => {
    it('delega en el use case con el id, completa y apaga loading', () => {
      deleteBranch.mockReturnValue(of(void 0));
      let completed = false;

      facade.deleteBranch(1).subscribe({ complete: () => (completed = true) });

      expect(completed).toBe(true);
      expect(deleteBranch).toHaveBeenCalledWith(1);
      expect(facade.loading()).toBe(false);
    });

    it('expone el error, lo registra, lo relanza y apaga loading', () => {
      const error = new Error('tiene inventario');
      deleteBranch.mockReturnValue(throwError(() => error));
      let caught: unknown;

      facade.deleteBranch(1).subscribe({ error: (err) => (caught = err) });

      expect(caught).toBe(error);
      expect(facade.errorMessage()).toBe('tiene inventario');
      expect(facade.loading()).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to delete branch', {
        message: 'tiene inventario',
        id: 1,
      });
    });
  });
});
