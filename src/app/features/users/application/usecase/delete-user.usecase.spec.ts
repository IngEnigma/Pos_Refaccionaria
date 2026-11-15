import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { UserRepository } from '@features/users/domain/repository/user-repository';
import { DeleteUserUseCase } from './delete-user.usecase';

describe('DeleteUserUseCase', () => {
  let repository: { deleteUser: jest.Mock };
  let useCase: DeleteUserUseCase;

  beforeEach(() => {
    repository = { deleteUser: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: UserRepository, useValue: repository }],
    });
    useCase = TestBed.inject(DeleteUserUseCase);
  });

  it('elimina el usuario por id y completa', (done) => {
    repository.deleteUser.mockReturnValue(of(void 0));

    useCase.execute(8).subscribe({
      complete: () => {
        expect(repository.deleteUser).toHaveBeenCalledWith(8);
        done();
      },
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('no autorizado');
    repository.deleteUser.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(8))).rejects.toBe(error);
  });
});
