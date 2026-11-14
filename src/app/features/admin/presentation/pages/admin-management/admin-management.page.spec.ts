import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, signal } from '@angular/core';
import { LucideAngularModule, Plus, Save, ShieldCheck, Truck, Users } from 'lucide-angular';
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
  const user: User = { id: 3, username: 'usuario.real', email: 'u@trt.com', isActive: true };

  const branches = signal<readonly Branch[]>([]);
  const users = signal<readonly User[]>([]);
  const branchesFacade = {
    branches, loading: signal(false).asReadonly(), errorMessage: signal<string | null>(null).asReadonly(),
    loadBranches: jest.fn(), createBranch: jest.fn(),
  };
  const usersFacade = {
    users, loading: signal(false).asReadonly(), errorMessage: signal<string | null>(null).asReadonly(),
    loadUsers: jest.fn(), createUser: jest.fn(),
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
    const values = { username: 'nuevo', email: 'n@trt.com', password: 'secreta', isActive: true };
    usersFacade.createUser.mockReturnValue(of(user));
    page.userForm.setValue(values);

    submit('user-form');

    expect(usersFacade.createUser).toHaveBeenCalledWith(values);
    expect(toast.success).toHaveBeenCalled();
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
  });

  it('muestra un error y conserva el formulario si falla la creación del usuario', () => {
    const values = { username: 'nuevo', email: 'n@trt.com', password: 'secreta', isActive: true };
    usersFacade.createUser.mockReturnValue(throwError(() => new Error('duplicado')));
    page.userForm.setValue(values);

    submit('user-form');

    expect(toast.error).toHaveBeenCalled();
    expect(page.userForm.getRawValue().username).toBe('nuevo');
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(1);
  });
});
