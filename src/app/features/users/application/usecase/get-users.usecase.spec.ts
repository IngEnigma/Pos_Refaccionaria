import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { GetUsersUseCase } from './get-users.usecase';

describe('GetUsersUseCase', () => {
  const users: User[] = [{ id: 1, username: 'ana', email: 'ana@trt.com', isActive: true, branchId: 1, role: 'cajero' }];
  let repository: { getUsers: jest.Mock };
  let useCase: GetUsersUseCase;

  beforeEach(() => {
    repository = { getUsers: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: UserRepository, useValue: repository }],
    });
    useCase = TestBed.inject(GetUsersUseCase);
  });

  it('devuelve el listado de usuarios del repositorio', (done) => {
    repository.getUsers.mockReturnValue(of(users));

    useCase.execute().subscribe((result) => {
      expect(result).toBe(users);
      expect(repository.getUsers).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('devuelve lista vacía cuando no hay usuarios', (done) => {
    repository.getUsers.mockReturnValue(of([]));

    useCase.execute().subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('sin conexión');
    repository.getUsers.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute())).rejects.toBe(error);
  });
});
