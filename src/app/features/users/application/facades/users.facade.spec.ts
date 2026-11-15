import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { CreateUserUseCase } from '@features/users/application/usecase/create-user.usecase';
import { DeleteUserUseCase } from '@features/users/application/usecase/delete-user.usecase';
import { UpdateUserUseCase } from '@features/users/application/usecase/update-user.usecase';
import { GetUsersUseCase } from '@features/users/application/usecase/get-users.usecase';
import { User } from '@features/users/domain/entities/user.entity';
import { UsersFacade } from './users.facade';

describe('UsersFacade', () => {
  const user: User = { id: 1, username: 'ana', email: 'ana@trt.com', isActive: true };
  const payload = { username: 'ana', password: 'x', email: 'ana@trt.com', isActive: true };
  let getUsers: jest.Mock;
  let createUser: jest.Mock;
  let updateUser: jest.Mock;
  let deleteUser: jest.Mock;
  let logger: { error: jest.Mock };
  let facade: UsersFacade;

  beforeEach(() => {
    getUsers = jest.fn();
    createUser = jest.fn();
    updateUser = jest.fn();
    deleteUser = jest.fn();
    logger = { error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: GetUsersUseCase, useValue: { execute: getUsers } },
        { provide: CreateUserUseCase, useValue: { execute: createUser } },
        { provide: UpdateUserUseCase, useValue: { execute: updateUser } },
        { provide: DeleteUserUseCase, useValue: { execute: deleteUser } },
        { provide: LoggerService, useValue: { withContext: () => logger } },
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

  it('arranca con lista vacía, sin loading y sin error', () => {
    expect(facade.users()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  it('loadUsers mantiene loading encendido mientras la petición sigue en curso', () => {
    const pending = new Subject<User[]>();
    getUsers.mockReturnValue(pending);

    facade.loadUsers();
    expect(facade.loading()).toBe(true);

    pending.next([user]);
    pending.complete();
    expect(facade.loading()).toBe(false);
  });

  it('loadUsers registra el fallo con su mensaje', () => {
    getUsers.mockReturnValue(throwError(() => new Error('boom')));

    facade.loadUsers();

    expect(logger.error).toHaveBeenCalledWith('Failed to load users', { message: 'boom' });
  });

  it('loadUsers limpia el error previo al recargar con éxito', () => {
    getUsers.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadUsers();
    expect(facade.errorMessage()).toBe('boom');
    getUsers.mockReturnValueOnce(of([user]));

    facade.loadUsers();

    expect(facade.errorMessage()).toBeNull();
    expect(facade.users()).toEqual([user]);
  });

  it('usa el mensaje inesperado cuando el fallo no es un Error', () => {
    getUsers.mockReturnValue(throwError(() => 'texto suelto'));

    facade.loadUsers();

    expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
  });

  it('usa el mensaje inesperado cuando el Error no trae message', () => {
    getUsers.mockReturnValue(throwError(() => new Error('')));

    facade.loadUsers();

    expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
  });

  it('createUser enciende loading y limpia el error al iniciar', () => {
    const pending = new Subject<User>();
    createUser.mockReturnValue(pending);
    getUsers.mockReturnValue(throwError(() => new Error('previo')));
    facade.loadUsers();

    facade.createUser(payload).subscribe();

    expect(facade.loading()).toBe(true);
    expect(facade.errorMessage()).toBeNull();
  });

  it('createUser apaga loading al completar con éxito', () => {
    createUser.mockReturnValue(of(user));

    facade.createUser(payload).subscribe();

    expect(facade.loading()).toBe(false);
  });

  it('createUser no filtra la contraseña al log al fallar', () => {
    const secret = { ...payload, password: 'S3cr3t-única' };
    createUser.mockReturnValue(throwError(() => new Error('usuario duplicado')));

    facade.createUser(secret).subscribe({ error: () => undefined });

    expect(logger.error).toHaveBeenCalledWith('Failed to create user', { message: 'usuario duplicado' });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(secret.password);
  });

  describe('updateUser / deleteUser (H-37)', () => {
    it('updateUser delega en el use case con id y payload parcial', () => {
      updateUser.mockReturnValue(of({ ...user, isActive: false }));
      let result: User | undefined;

      facade.updateUser(1, { isActive: false }).subscribe((u) => (result = u));

      expect(updateUser).toHaveBeenCalledWith(1, { isActive: false });
      expect(result?.isActive).toBe(false);
      expect(facade.loading()).toBe(false);
    });

    it('deleteUser delega en el use case por id', () => {
      deleteUser.mockReturnValue(of(undefined));
      let done = false;

      facade.deleteUser(1).subscribe({ complete: () => (done = true) });

      expect(deleteUser).toHaveBeenCalledWith(1);
      expect(done).toBe(true);
    });

    it('si falla expone el error, lo relanza y apaga loading', () => {
      deleteUser.mockReturnValue(throwError(() => new Error('sin permiso')));
      let failed = false;

      facade.deleteUser(1).subscribe({ error: () => (failed = true) });

      expect(failed).toBe(true);
      expect(facade.errorMessage()).toBe('sin permiso');
      expect(facade.loading()).toBe(false);
    });
  });
});
