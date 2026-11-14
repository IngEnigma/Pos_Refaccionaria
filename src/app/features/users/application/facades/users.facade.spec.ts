import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { CreateUserUseCase } from '@features/users/application/usecase/create-user.usecase';
import { GetUsersUseCase } from '@features/users/application/usecase/get-users.usecase';
import { User } from '@features/users/domain/entities/user.entity';
import { UsersFacade } from './users.facade';

describe('UsersFacade', () => {
  const user: User = { id: 1, username: 'ana', email: 'ana@trt.com', isActive: true };
  const payload = { username: 'ana', password: 'x', email: 'ana@trt.com', isActive: true };
  let getUsers: jest.Mock;
  let createUser: jest.Mock;
  let facade: UsersFacade;

  beforeEach(() => {
    getUsers = jest.fn();
    createUser = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: GetUsersUseCase, useValue: { execute: getUsers } },
        { provide: CreateUserUseCase, useValue: { execute: createUser } },
        { provide: LoggerService, useValue: { withContext: () => ({ error: jest.fn() }) } },
      ],
    });
    facade = TestBed.inject(UsersFacade);
  });

  it('loadUsers publica los usuarios y apaga loading', () => {
    getUsers.mockReturnValue(of([user]));

    facade.loadUsers();

    expect(facade.users()).toEqual([user]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  it('loadUsers deja la lista vacía y expone el error si falla', () => {
    getUsers.mockReturnValue(throwError(() => new Error('boom')));

    facade.loadUsers();

    expect(facade.users()).toEqual([]);
    expect(facade.errorMessage()).toBe('boom');
    expect(facade.loading()).toBe(false);
  });

  it('createUser delega en el use case y devuelve el usuario creado', (done) => {
    createUser.mockReturnValue(of(user));

    facade.createUser(payload).subscribe((created) => {
      expect(created).toEqual(user);
      expect(createUser).toHaveBeenCalledWith(payload);
      done();
    });
  });

  it('createUser expone el error, lo relanza y apaga loading', () => {
    createUser.mockReturnValue(throwError(() => new Error('usuario duplicado')));
    let caught: Error | undefined;

    facade.createUser(payload).subscribe({ error: (err) => (caught = err) });

    expect(caught?.message).toBe('usuario duplicado');
    expect(facade.errorMessage()).toBe('usuario duplicado');
    expect(facade.loading()).toBe(false);
  });
});
