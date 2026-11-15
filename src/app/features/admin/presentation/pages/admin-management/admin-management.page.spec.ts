import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, signal } from '@angular/core';
import { LucideAngularModule, Plus, Save, ShieldCheck, Truck, Users } from 'lucide-angular';
import { Dialog } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';

import { BranchesFacade } from '@features/branches/application/facades/branches.facade';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import { UsersFacade } from '@features/users/application/facades/users.facade';
import { User } from '@features/users/domain/entities/user.entity';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { AdminManagementPageComponent } from './admin-management.page';

// H-03 (a): la página lee y escribe vía facades; ya no hay datos fijos.
describe('AdminManagementPageComponent', () => {
  const branch: Branch = {
    id: 7, nombreSucursal: 'Sucursal Real', codigoSucursal: 'SUC-007', ubicacion: 'Calle 1',
    codigoPostal: '12345', numeroTelefono: '5512345678', correoElectronico: 'real@trt.com',
  };
  const user: User = { id: 3, username: 'usuario.real', email: 'u@trt.com', isActive: true, branchId: 1, role: 'cajero' };

  const branches = signal<readonly Branch[]>([]);
  const users = signal<readonly User[]>([]);
  const branchesLoading = signal(false);
  const usersLoading = signal(false);
  const branchesFacade = {
    branches, loading: branchesLoading.asReadonly(), errorMessage: signal<string | null>(null).asReadonly(),
    loadBranches: jest.fn(), createBranch: jest.fn(),
  };
  const usersFacade = {
    users, loading: usersLoading.asReadonly(), errorMessage: signal<string | null>(null).asReadonly(),
    loadUsers: jest.fn(), createUser: jest.fn(), updateUser: jest.fn(), deleteUser: jest.fn(),
  };

  let fixture: ComponentFixture<AdminManagementPageComponent>;
  let page: AdminManagementPageComponent;
  let toast: ToastService;

  const text = () => fixture.nativeElement.textContent as string;
  const submit = (id: string) => {
    fixture.nativeElement.querySelector(`#${id}`).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    branches.set([branch]);
    users.set([user]);
    branchesLoading.set(false);
    usersLoading.set(false);
    TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ Plus, Save, ShieldCheck, Truck, Users })),
        { provide: BranchesFacade, useValue: branchesFacade },
        { provide: UsersFacade, useValue: usersFacade },
      ],
    });
    toast = TestBed.inject(ToastService);
    jest.spyOn(toast, 'success');
    jest.spyOn(toast, 'error');
    fixture = TestBed.createComponent(AdminManagementPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga sucursales y usuarios al iniciar', () => {
    expect(branchesFacade.loadBranches).toHaveBeenCalledTimes(1);
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(1);
  });

  it('muestra los datos de las facades y no los datos fijos de la maqueta', () => {
    expect(text()).toContain('Sucursal Real');
    expect(text()).toContain('usuario.real');
    expect(text()).not.toContain('Matriz Centro');
    expect(text()).not.toContain('Mariana Ruiz');
  });

  it('no crea sucursal con el formulario inválido', () => {
    submit('branch-form');

    expect(branchesFacade.createBranch).not.toHaveBeenCalled();
  });

  it('crea la sucursal con los valores del formulario, avisa y recarga la lista', () => {
    const values = {
      nombreSucursal: 'Nueva', ubicacion: 'Calle 2', codigoPostal: '54321',
      numeroTelefono: '5500000000', correoElectronico: 'n@trt.com',
    };
    branchesFacade.createBranch.mockReturnValue(of(branch));
    page.branchForm.setValue(values);

    submit('branch-form');

    expect(branchesFacade.createBranch).toHaveBeenCalledWith(values);
    expect(toast.success).toHaveBeenCalled();
    expect(branchesFacade.loadBranches).toHaveBeenCalledTimes(2);
    expect(page.branchForm.getRawValue().nombreSucursal).toBe('');
  });

  it('no crea usuario con el formulario inválido', () => {
    submit('user-form');

    expect(usersFacade.createUser).not.toHaveBeenCalled();
  });

  it('crea el usuario con los valores del formulario, avisa y recarga la lista', () => {
    const values = { username: 'nuevo', email: 'n@trt.com', password: 'secreta', isActive: true, branchId: 7, role: 'cajero' };
    usersFacade.createUser.mockReturnValue(of(user));
    page.userForm.setValue(values);

    submit('user-form');

    expect(usersFacade.createUser).toHaveBeenCalledWith(values);
    expect(toast.success).toHaveBeenCalled();
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
  });

  it('muestra un error y conserva el formulario si falla la creación del usuario', () => {
    const values = { username: 'nuevo', email: 'n@trt.com', password: 'secreta', isActive: true, branchId: 7, role: 'cajero' };
    usersFacade.createUser.mockReturnValue(throwError(() => new Error('duplicado')));
    page.userForm.setValue(values);

    submit('user-form');

    expect(toast.error).toHaveBeenCalled();
    expect(page.userForm.getRawValue().username).toBe('nuevo');
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(1);
  });

  describe('crear sucursal: ramas de error y validación', () => {
    const validBranch = {
      nombreSucursal: 'Nueva', ubicacion: 'Calle 2', codigoPostal: '54321',
      numeroTelefono: '5500000000', correoElectronico: 'n@trt.com',
    };

    it('muestra el mensaje del error, conserva el formulario y no recarga si falla la creación', () => {
      branchesFacade.createBranch.mockReturnValue(throwError(() => new Error('sucursal duplicada')));
      page.branchForm.setValue(validBranch);

      submit('branch-form');

      expect(toast.error).toHaveBeenCalledWith('sucursal duplicada');
      expect(toast.success).not.toHaveBeenCalled();
      expect(page.branchForm.getRawValue()).toEqual(validBranch);
      expect(branchesFacade.loadBranches).toHaveBeenCalledTimes(1);
    });

    it('usa el mensaje genérico del toast si el error no es un Error con mensaje', () => {
      branchesFacade.createBranch.mockReturnValue(throwError(() => 'falló'));
      page.branchForm.setValue(validBranch);

      submit('branch-form');

      expect(toast.error).toHaveBeenCalledWith(undefined);
    });

    it('usa el mensaje genérico del toast si el Error viene sin mensaje', () => {
      usersFacade.createUser.mockReturnValue(throwError(() => new Error('')));
      page.userForm.setValue({ username: 'a', email: 'a@trt.com', password: 'x', isActive: true, branchId: 7, role: 'cajero' });

      submit('user-form');

      expect(toast.error).toHaveBeenCalledWith(undefined);
    });

    it('muestra el mensaje exacto del error al fallar la creación del usuario', () => {
      usersFacade.createUser.mockReturnValue(throwError(() => new Error('usuario duplicado')));
      page.userForm.setValue({ username: 'a', email: 'a@trt.com', password: 'x', isActive: true, branchId: 7, role: 'cajero' });

      submit('user-form');

      expect(toast.error).toHaveBeenCalledWith('usuario duplicado');
    });

    it.each([
      ['correo inválido', { correoElectronico: 'no-es-correo' }],
      ['teléfono con letras o guiones', { numeroTelefono: '55-12ab' }],
      ['nombre de menos de 3 caracteres', { nombreSucursal: 'ab' }],
      ['dirección vacía', { ubicacion: '' }],
      ['código postal vacío', { codigoPostal: '' }],
    ])('no crea la sucursal con %s y marca los campos como tocados', (_caso, override) => {
      page.branchForm.setValue({ ...validBranch, ...override });

      submit('branch-form');

      expect(branchesFacade.createBranch).not.toHaveBeenCalled();
      expect(page.branchForm.touched).toBe(true);
    });

    it.each([
      ['nombre de usuario vacío', { username: '' }],
      ['correo inválido', { email: 'x' }],
      ['contraseña vacía', { password: '' }],
      ['sin sucursal', { branchId: null }],
      ['sin rol', { role: '' }],
    ])('no crea el usuario con %s', (_caso, override) => {
      page.userForm.setValue({ username: 'a', email: 'a@trt.com', password: 'x', isActive: true, branchId: 7, role: 'cajero', ...override });

      submit('user-form');

      expect(usersFacade.createUser).not.toHaveBeenCalled();
      expect(page.userForm.touched).toBe(true);
    });
  });

  describe('resumen y tablas', () => {
    const extraBranch: Branch = { ...branch, id: 8, nombreSucursal: 'Sucursal Norte', codigoSucursal: 'SUC-008' };
    const inactive: User = { id: 4, username: 'baja.usuario', email: 'b@trt.com', isActive: false, branchId: 1, role: 'cajero' };

    // Los tres contadores del resumen en orden: sucursales, usuarios, usuarios activos.
    const summary = () =>
      Array.from(fixture.nativeElement.querySelectorAll('.summary-card strong')).map((n) => (n as HTMLElement).textContent?.trim());

    it('cuenta sucursales, usuarios y usuarios activos', () => {
      branches.set([branch, extraBranch]);
      users.set([user, inactive, { ...user, id: 5, username: 'otro.activo' }]);
      fixture.detectChanges();

      expect(summary()).toEqual(['2', '3', '2']);
      expect(page.activeUsers()).toBe(2);
    });

    it('muestra ceros si no hay datos', () => {
      branches.set([]);
      users.set([]);
      fixture.detectChanges();

      expect(summary()).toEqual(['0', '0', '0']);
    });

    it('lista todas las sucursales con código, teléfono y correo', () => {
      branches.set([branch, extraBranch]);
      fixture.detectChanges();

      expect(text()).toContain('Sucursal Norte');
      expect(text()).toContain('SUC-008');
      expect(text()).toContain('5512345678');
      expect(text()).toContain('real@trt.com');
    });

    it('rotula "Activo" e "Inactivo" y marca como pendiente al usuario inactivo', () => {
      users.set([user, inactive]);
      fixture.detectChanges();

      const statuses = Array.from(fixture.nativeElement.querySelectorAll('.status')) as HTMLElement[];
      expect(statuses.map((s) => s.textContent?.trim())).toEqual(['Activo', 'Inactivo']);
      expect(statuses[0].classList.contains('pending')).toBe(false);
      expect(statuses[1].classList.contains('pending')).toBe(true);
    });
  });

  describe('estados de carga y limpieza de formularios', () => {
    const submitButton = (id: string) =>
      fixture.nativeElement.querySelector(`#${id} button[type="submit"]`) as HTMLButtonElement;

    it('deshabilita "Guardar sucursal" mientras la fachada de sucursales carga', () => {
      expect(submitButton('branch-form').disabled).toBe(false);

      branchesLoading.set(true);
      fixture.detectChanges();

      expect(submitButton('branch-form').disabled).toBe(true);
      expect(submitButton('user-form').disabled).toBe(false);
    });

    it('deshabilita "Crear usuario" mientras la fachada de usuarios carga', () => {
      usersLoading.set(true);
      fixture.detectChanges();

      expect(submitButton('user-form').disabled).toBe(true);
      expect(submitButton('branch-form').disabled).toBe(false);
    });

    it('"Limpiar" vacía el formulario de sucursal', () => {
      page.branchForm.patchValue({ nombreSucursal: 'Temp', ubicacion: 'X' });

      (fixture.nativeElement.querySelector('#branch-form .btn-secondary') as HTMLButtonElement).click();

      expect(page.branchForm.getRawValue().nombreSucursal).toBe('');
      expect(page.branchForm.getRawValue().ubicacion).toBe('');
    });

    it('"Cancelar" vacía el formulario de usuario y restablece el estado a Activo', () => {
      page.userForm.patchValue({ username: 'temp', isActive: false });

      (fixture.nativeElement.querySelector('#user-form .btn-secondary') as HTMLButtonElement).click();

      expect(page.userForm.getRawValue().username).toBe('');
      expect(page.userForm.getRawValue().isActive).toBe(true);
    });
  });

  describe('acciones por fila de usuario (H-37)', () => {
    const confirm = (value: boolean) =>
      jest.spyOn(Dialog.prototype, 'open').mockReturnValue({ closed: of(value) } as never);

    afterEach(() => jest.restoreAllMocks());

    it('el botón Desactivar actualiza isActive, avisa y recarga la lista', () => {
      usersFacade.updateUser.mockReturnValue(of({ ...user, isActive: false }));

      fixture.nativeElement.querySelector('button.toggle-user').click();

      expect(usersFacade.updateUser).toHaveBeenCalledWith(3, { isActive: false });
      expect(toast.success).toHaveBeenCalled();
      expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
    });

    it('eliminar pide confirmación y, si se acepta, borra el usuario y recarga', () => {
      confirm(true);
      usersFacade.deleteUser.mockReturnValue(of(undefined));

      fixture.nativeElement.querySelector('button.delete-user').click();

      expect(usersFacade.deleteUser).toHaveBeenCalledWith(3);
      expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
    });

    it('eliminar cancelado no borra nada', () => {
      confirm(false);

      fixture.nativeElement.querySelector('button.delete-user').click();

      expect(usersFacade.deleteUser).not.toHaveBeenCalled();
    });

    it('si falla el borrado muestra el error', () => {
      confirm(true);
      usersFacade.deleteUser.mockReturnValue(throwError(() => new Error('no se puede eliminar')));

      fixture.nativeElement.querySelector('button.delete-user').click();

      expect(toast.error).toHaveBeenCalledWith('no se puede eliminar');
    });

    it('si falla muestra el error', () => {
      usersFacade.updateUser.mockReturnValue(throwError(() => new Error('sin permiso')));

      fixture.nativeElement.querySelector('button.toggle-user').click();

      expect(toast.error).toHaveBeenCalledWith('sin permiso');
    });
  });

  describe('mensajes de validación (H-53)', () => {
    it('al enviar la sucursal vacía muestra un mensaje por campo', () => {
      submit('branch-form');

      expect(text()).toContain('El nombre es requerido');
      expect(text()).toContain('La dirección es requerida');
      expect(text()).toContain('El código postal es requerido');
      expect(text()).toContain('Teléfono inválido');
      expect(text()).toContain('Ingrese un correo electrónico válido');
    });

    it('al enviar el usuario vacío muestra un mensaje por campo', () => {
      submit('user-form');

      expect(text()).toContain('El usuario es requerido');
      expect(text()).toContain('Ingrese un correo electrónico válido');
      expect(text()).toContain('La contraseña es requerida');
      expect(fixture.nativeElement.querySelector('#user-branch-error')?.textContent).toContain('Seleccione una sucursal');
      expect(fixture.nativeElement.querySelector('#user-role-error')?.textContent).toContain('Seleccione un rol');
    });

    it('el select de sucursal lista las sucursales cargadas y el de rol ofrece cajero, encargado y admin', () => {
      const options = (id: string) =>
        Array.from(fixture.nativeElement.querySelectorAll(`#${id} option`)).map((o) => (o as HTMLElement).textContent?.trim());

      expect(options('user-branch')).toContain('Sucursal Real');
      expect(options('user-role')).toEqual(expect.arrayContaining(['Cajero', 'Encargado', 'Admin']));
    });

    it('el campo inválido queda marcado con aria-invalid', () => {
      submit('user-form');

      expect(fixture.nativeElement.querySelector('#user-name').getAttribute('aria-invalid')).toBe('true');
    });

    it('la sucursal respeta los topes del backend (CP 10, teléfono 15, sin solo espacios)', () => {
      page.branchForm.setValue({
        nombreSucursal: '   ', ubicacion: '  ', codigoPostal: '12345678901',
        numeroTelefono: '1234567890123456', correoElectronico: 'n@trt.com',
      });

      expect(page.branchForm.controls.nombreSucursal.invalid).toBe(true);
      expect(page.branchForm.controls.ubicacion.invalid).toBe(true);
      expect(page.branchForm.controls.codigoPostal.invalid).toBe(true);
      expect(page.branchForm.controls.numeroTelefono.invalid).toBe(true);
    });
  });
});
