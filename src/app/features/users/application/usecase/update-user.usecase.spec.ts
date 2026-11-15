import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import {
  UpdateUserPayload,
  UserRepository,
} from '@features/users/domain/repository/user-repository';
import { UpdateUserUseCase } from './update-user.usecase';

describe('UpdateUserUseCase', () => {
  const payload: UpdateUserPayload = { email: 'nuevo@trt.com', isActive: false };
  const updated: User = { id: 3, username: 'ana', email: 'nuevo@trt.com', isActive: false, branchId: 1, role: 'cajero' };
  let repository: { updateUser: jest.Mock };
  let useCase: UpdateUserUseCase;

  beforeEach(() => {
    repository = { updateUser: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: UserRepository, useValue: repository }],
    });
    useCase = TestBed.inject(UpdateUserUseCase);
  });

  it('actualiza el usuario por id con el payload parcial y devuelve el resultado', (done) => {
    repository.updateUser.mockReturnValue(of(updated));

    useCase.execute(3, payload).subscribe((result) => {
      expect(result).toBe(updated);
      expect(repository.updateUser).toHaveBeenCalledWith(3, payload);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('no existe');
    repository.updateUser.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(3, payload))).rejects.toBe(error);
  });
});
