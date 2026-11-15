import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SKIP_TRAILING_SLASH } from '@core/interceptors/trailing-slash.interceptor';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { UserResponseDto } from '@features/users/application/dtos/user-response.dto';
import { UserRepositoryImpl } from './user-repository.impl';

const envStub: Environment = {
  apiUrl: 'http://api.test',
  production: false,
  loggingLevel: 0,
};

describe('UserRepositoryImpl', () => {
  // El backend define `users` y `users/<id>` sin slash final.
  const endpoint = `${envStub.apiUrl}/users`;
  const dto: UserResponseDto = { id: 5, username: 'ana', email: 'ana@trt.com', is_active: true };
  const expectedUser = { id: 5, username: 'ana', email: 'ana@trt.com', isActive: true };
  let repository: UserRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(UserRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUsers hace GET a /users sin slash final y mapea cada DTO a entidad', () => {
    let result: unknown;

    repository.getUsers().subscribe((users) => (result = users));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(SKIP_TRAILING_SLASH)).toBe(true);
    req.flush([dto, { ...dto, id: 6, is_active: false }]);
    expect(result).toEqual([expectedUser, { ...expectedUser, id: 6, isActive: false }]);
  });

  it('getUsers devuelve lista vacía si no hay usuarios', () => {
    let result: unknown;

    repository.getUsers().subscribe((users) => (result = users));

    httpMock.expectOne(endpoint).flush([]);
    expect(result).toEqual([]);
  });

  it('createUser hace POST con el cuerpo en snake_case y sin slash final', () => {
    let result: unknown;

    repository
      .createUser({ username: 'ana', password: 'secreta123', email: 'ana@trt.com', isActive: true, branchId: 4, role: 'cajero' })
      .subscribe((user) => (result = user));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(SKIP_TRAILING_SLASH)).toBe(true);
    expect(req.request.body).toEqual({
      username: 'ana',
      password: 'secreta123',
      email: 'ana@trt.com',
      is_active: true,
      id_sucursal: 4,
      rol: 'cajero',
    });
    req.flush(dto);
    expect(result).toEqual(expectedUser);
  });

  it('updateUser hace PUT a /users/:id solo con los campos informados', () => {
    let result: unknown;

    repository.updateUser(5, { isActive: false }).subscribe((user) => (result = user));

    const req = httpMock.expectOne(`${endpoint}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.context.get(SKIP_TRAILING_SLASH)).toBe(true);
    expect(JSON.parse(JSON.stringify(req.request.body))).toEqual({ is_active: false });
    req.flush({ ...dto, is_active: false });
    expect(result).toEqual({ ...expectedUser, isActive: false });
  });

  it('deleteUser hace DELETE a /users/:id sin slash final y completa', () => {
    let completed = false;

    repository.deleteUser(5).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(`${endpoint}/5`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.context.get(SKIP_TRAILING_SLASH)).toBe(true);
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('propaga el HttpErrorResponse cuando el backend rechaza la creación con 400', () => {
    let error: HttpErrorResponse | undefined;

    repository
      .createUser({ username: 'ana', password: 'x', email: 'ana@trt.com', isActive: true, branchId: 4, role: 'cajero' })
      .subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(endpoint).flush({ username: ['Ya existe.'] }, { status: 400, statusText: 'Bad Request' });
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error?.status).toBe(400);
  });

  it('propaga el HttpErrorResponse cuando el backend responde 403 al listar', () => {
    let error: HttpErrorResponse | undefined;

    repository.getUsers().subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(endpoint).flush({ detail: 'Prohibido' }, { status: 403, statusText: 'Forbidden' });
    expect(error?.status).toBe(403);
  });
});
