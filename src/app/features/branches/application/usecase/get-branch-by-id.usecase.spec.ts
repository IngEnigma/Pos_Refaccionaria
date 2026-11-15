import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { GetBranchByIdUseCase } from './get-branch-by-id.usecase';

describe('GetBranchByIdUseCase', () => {
  const branch: Branch = {
    id: 5,
    nombreSucursal: 'Norte',
    codigoSucursal: 'SUC-005',
    ubicacion: 'Av. Norte 10',
    codigoPostal: '29010',
    numeroTelefono: '9617654321',
    correoElectronico: 'norte@trt.com',
  };
  let repository: { getById: jest.Mock };
  let useCase: GetBranchByIdUseCase;

  beforeEach(() => {
    repository = { getById: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: BranchRepository, useValue: repository }],
    });
    useCase = TestBed.inject(GetBranchByIdUseCase);
  });

  it('devuelve la sucursal solicitada por id', (done) => {
    repository.getById.mockReturnValue(of(branch));

    useCase.execute(5).subscribe((result) => {
      expect(result).toBe(branch);
      expect(repository.getById).toHaveBeenCalledWith(5);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('no encontrada');
    repository.getById.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(5))).rejects.toBe(error);
  });
});
