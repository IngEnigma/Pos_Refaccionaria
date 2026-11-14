import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LucideAngularModule, Plus, Save, ShieldCheck, Truck, Users } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { BranchRepositoryImpl } from '@features/branches/infrastructure/repositories/branch-repository.impl';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { UserRepositoryImpl } from '@features/users/infrastructure/repositories/user-repository.impl';
import { UsersFacade } from '@features/users/application/facades/users.facade';
import { UpdateUserUseCase } from '@features/users/application/usecase/update-user.usecase';
import { DeleteUserUseCase } from '@features/users/application/usecase/delete-user.usecase';
import { AdminManagementPageComponent } from './admin-management.page';

/**
 * INT-09: AdminManagementPage -> UsersFacade/BranchesFacade -> use cases -> repositorios -> HttpClient
 * (con trailingSlashInterceptor: `users` y `users/<id>` van SIN slash final, `sucursales/` con slash).
 * Contrato backend (usuario/*): GET/POST /users, PUT/DELETE /users/<id>; errores como `{"error": "..."}`;
 * DELETE solo staff (403 `{"error": "No autorizado"}`) y responde 204.
 */
describe('INT-09 Usuarios (página admin + facade + repositorio + http)', () => {
  const API = environment.apiUrl;
  const USERS = `${API}/users`;
  const SUCURSALES = `${API}/sucursales/`;
  let fixture: ComponentFixture<AdminManagementPageComponent>;
  let httpMock: HttpTestingController;
  let toasts: ToastService;

  const userDto = (id: number, username: string, active = true) => ({
    id,
    username,
    email: `${username}@trt.com`,
    is_active: active,
  });
  const text = () => fixture.nativeElement.textContent as string;
  const lastToast = (type: 'success' | 'error') => toasts.toasts().filter((t) => t.type === type).at(-1)?.message;

  const fillAndSubmitUser = (username = 'nuevo', email = 'nuevo@trt.com', password = 'Secreta123') => {
    const set = (id: string, value: string) => {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('user-name', username);
    set('user-email', email);
    set('user-password', password);
    fixture.nativeElement.querySelector('#user-form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([trailingSlashInterceptor])),
        provideHttpClientTesting(),
        importProvidersFrom(LucideAngularModule.pick({ Plus, Save, ShieldCheck, Truck, Users })),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: UserRepository, useClass: UserRepositoryImpl },
        { provide: BranchRepository, useClass: BranchRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(AdminManagementPageComponent);
    fixture.detectChanges(); // ngOnInit
    httpMock.expectOne(SUCURSALES).flush([]);
    httpMock.expectOne(USERS).flush([userDto(1, 'admin'), userDto(2, 'cajero1', false)]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('al abrir lista los usuarios del backend (GET /users sin slash final)', () => {
    expect(text()).toContain('admin');
    expect(text()).toContain('cajero1');
    expect(text()).toContain('Inactivo');
  });

  it('crear usuario: POST /users con el contrato del backend, avisa y refresca la lista', () => {
    fillAndSubmitUser();

    const post = httpMock.expectOne(USERS);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      username: 'nuevo',
      password: 'Secreta123',
      email: 'nuevo@trt.com',
      is_active: true,
    });
    post.flush(userDto(3, 'nuevo'));
    httpMock.expectOne(USERS).flush([userDto(1, 'admin'), userDto(2, 'cajero1', false), userDto(3, 'nuevo')]);
    fixture.detectChanges();

    expect(lastToast('success')).toBe('Usuario creado correctamente.');
    expect(text()).toContain('nuevo');
  });

  it('formulario incompleto no envía nada', () => {
    fixture.nativeElement.querySelector('#user-form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    httpMock.expectNone(USERS);
  });

  describe('errores del backend visibles al usuario', () => {
    it('usuario duplicado (400 {"error"}): muestra el texto del backend y no refresca la lista', () => {
      fillAndSubmitUser('admin');

      httpMock
        .expectOne(USERS)
        .flush({ error: 'El nombre de usuario ya existe' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(lastToast('error')).toBe('El nombre de usuario ya existe');
      expect(TestBed.inject(UsersFacade).errorMessage()).toBe('El nombre de usuario ya existe');
      httpMock.expectNone(USERS);
    });

    it('sin permiso (403 {"detail"}): muestra el motivo del backend', () => {
      fillAndSubmitUser();

      httpMock
        .expectOne(USERS)
        .flush({ detail: "Requiere permiso 'usuarios.gestionar' (rol insuficiente)" }, { status: 403, statusText: 'Forbidden' });
      fixture.detectChanges();

      expect(lastToast('error')).toContain('usuarios.gestionar');
    });
  });

  describe('use cases de edición y baja (el UI actual no los consume)', () => {
    it('editar: PUT /users/<id> sin slash final con los campos mapeados', async () => {
      const done = firstValueFrom(TestBed.inject(UpdateUserUseCase).execute(2, { email: 'otro@trt.com', isActive: true }));

      const put = httpMock.expectOne(`${USERS}/2`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body.email).toBe('otro@trt.com');
      expect(put.request.body.is_active).toBe(true);
      put.flush(userDto(2, 'cajero1'));

      expect((await done).isActive).toBe(true);
    });

    it('eliminar: DELETE /users/<id> sin slash final, responde 204', async () => {
      const done = firstValueFrom(TestBed.inject(DeleteUserUseCase).execute(2), { defaultValue: undefined });

      const del = httpMock.expectOne(`${USERS}/2`);
      expect(del.request.method).toBe('DELETE');
      del.flush(null, { status: 204, statusText: 'No Content' });

      await expect(done).resolves.toBeNull();
    });

    it('eliminar sin ser staff: el 403 del backend llega al llamador', async () => {
      const done = firstValueFrom(TestBed.inject(DeleteUserUseCase).execute(2)).catch((e) => e);

      httpMock.expectOne(`${USERS}/2`).flush({ error: 'No autorizado' }, { status: 403, statusText: 'Forbidden' });

      expect((await done).status).toBe(403);
    });
  });

  it.todo('H-47: el alta de usuario no envía id_sucursal ni rol; el backend crea el usuario sin perfil y no puede operar (sin sucursal)');
});
