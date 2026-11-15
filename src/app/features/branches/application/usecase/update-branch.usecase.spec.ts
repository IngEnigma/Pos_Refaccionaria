import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchRepository,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { UpdateBranchUseCase } from './update-branch.usecase';

describe('UpdateBranchUseCase', () => {
  const payload: UpdateBranchPayload = { nombreSucursal: 'Centro 2' };
  const updated: Branch = {
    id: 4,
    nombreSucursal: 'Centro 2',
    codigoSucursal: 'SUC-004',
    ubicacion: 'Calle 1',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  let repository: { update: jest.Mock };
  let useCase: UpdateBranchUseCase;

  beforeEach(() => {
    repository = { update: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: BranchRepository, useValue: repository }],
    });
    useCase = TestBed.inject(UpdateBranchUseCase);
  });

  it('actualiza la sucursal por id con el payload parcial y devuelve el resultado', (done) => {
    repository.update.mockReturnValue(of(updated));

    useCase.execute(4, payload).subscribe((result) => {
      expect(result).toBe(updated);
      expect(repository.update).toHaveBeenCalledWith(4, payload);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('no existe');
    repository.update.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(4, payload))).rejects.toBe(error);
  });
});
