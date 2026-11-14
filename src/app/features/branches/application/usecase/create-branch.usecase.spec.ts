import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchRepository,
  CreateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { CreateBranchUseCase } from './create-branch.usecase';

describe('CreateBranchUseCase', () => {
  const payload: CreateBranchPayload = {
    nombreSucursal: 'Centro',
    ubicacion: 'Calle 1',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  const created: Branch = { id: 1, codigoSucursal: 'SUC-001', ...payload };
  let repository: { create: jest.Mock };
  let useCase: CreateBranchUseCase;

  beforeEach(() => {
    repository = { create: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: BranchRepository, useValue: repository }],
    });
    useCase = TestBed.inject(CreateBranchUseCase);
  });

  it('crea la sucursal delegando el payload al repositorio y devuelve el resultado', (done) => {
    repository.create.mockReturnValue(of(created));

    useCase.execute(payload).subscribe((result) => {
      expect(result).toBe(created);
      expect(repository.create).toHaveBeenCalledWith(payload);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('sucursal duplicada');
    repository.create.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(payload))).rejects.toBe(error);
  });
});
