import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { DeleteBranchUseCase } from './delete-branch.usecase';

describe('DeleteBranchUseCase', () => {
  let repository: { delete: jest.Mock };
  let useCase: DeleteBranchUseCase;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: BranchRepository, useValue: repository }],
    });
    useCase = TestBed.inject(DeleteBranchUseCase);
  });

  it('elimina la sucursal por id y completa', (done) => {
    repository.delete.mockReturnValue(of(void 0));

    useCase.execute(9).subscribe({
      complete: () => {
        expect(repository.delete).toHaveBeenCalledWith(9);
        done();
      },
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('sucursal con inventario');
    repository.delete.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(9))).rejects.toBe(error);
  });
});
