import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { User } from '@features/users/domain/entities/user.entity';
import {
  CreateUserPayload,
  UserRepository,
} from '@features/users/domain/repository/user-repository';
import { CreateUserUseCase } from './create-user.usecase';

describe('CreateUserUseCase', () => {
  const payload: CreateUserPayload = {
    username: 'ana',
    password: 'secreta123',
    email: 'ana@trt.com',
    isActive: true,
    branchId: 4,
    role: 'cajero',
  };
  const created: User = { id: 1, username: 'ana', email: 'ana@trt.com', isActive: true };
  let repository: { createUser: jest.Mock };
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repository = { createUser: jest.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: UserRepository, useValue: repository }],
    });
    useCase = TestBed.inject(CreateUserUseCase);
  });

  it('crea el usuario delegando el payload al repositorio y devuelve el resultado', (done) => {
    repository.createUser.mockReturnValue(of(created));

    useCase.execute(payload).subscribe((result) => {
      expect(result).toBe(created);
      expect(repository.createUser).toHaveBeenCalledWith(payload);
      done();
    });
  });

  it('propaga el error del repositorio sin alterarlo', async () => {
    const error = new Error('usuario duplicado');
    repository.createUser.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(payload))).rejects.toBe(error);
  });
});
