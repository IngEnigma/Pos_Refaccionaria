import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { GetBranchesUseCase } from './get-branches.usecase';

describe('GetBranchesUseCase', () => {
  const branches: Branch[] = [
    {
      id: 1,
      nombreSucursal: 'Centro',
      codigoSucursal: 'SUC-001',
      ubicacion: 'Calle 1',
      codigoPostal: '29000',
      numeroTelefono: '9611234567',
      correoElectronico: 'centro@trt.com',
    },
  ];
  let repository: { getBranches: jest.Mock };
  let useCase: GetBranchesUseCase;

  beforeEach(() => {
    repository = { getBranches: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: BranchRepository, useValue: repository }],
    });
    useCase = TestBed.inject(GetBranchesUseCase);
  });

  it('devuelve el listado de sucursales del repositorio', (done) => {
    repository.getBranches.mockReturnValue(of(branches));

    useCase.execute().subscribe((result) => {
      expect(result).toBe(branches);
      expect(repository.getBranches).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('devuelve lista vacía cuando no hay sucursales', (done) => {
    repository.getBranches.mockReturnValue(of([]));

    useCase.execute().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('sin conexión');
    repository.getBranches.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
