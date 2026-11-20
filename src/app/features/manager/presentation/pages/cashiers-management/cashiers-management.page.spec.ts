import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, signal } from '@angular/core';
import { LucideAngularModule, Plus, Save, ShieldCheck, Users } from 'lucide-angular';
import { of, throwError } from 'rxjs';

import { UsersFacade } from '@features/users/application/facades/users.facade';
import { User } from '@features/users/domain/entities/user.entity';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { CashiersManagementPageComponent } from './cashiers-management.page';

// H-F4-1: la página lee y escribe vía UsersFacade; ya no hay cajeros fijos.
describe('CashiersManagementPageComponent', () => {
  const user = (id: number, username: string, role: User['role'], isActive = true): User => ({
    id, username, email: `${username}@trt.com`, isActive, branchId: 1, role,
  });
  const users = signal<readonly User[]>([]);
  const usersFacade = {
    users, loading: signal(false).asReadonly(), errorMessage: signal<string | null>(null).asReadonly(),
    loadUsers: jest.fn(), createUser: jest.fn(), updateUser: jest.fn(),
  };

  let fixture: ComponentFixture<CashiersManagementPageComponent>;
  let toast: ToastService;
  const el = () => fixture.nativeElement as HTMLElement;
  const type = (id: string, value: string) => {
    const input = el().querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const rowButton = (row: number, name: string) =>
    Array.from(el().querySelectorAll('tbody tr')[row].querySelectorAll('button')).find((b) => b.textContent?.includes(name))!;

  beforeEach(() => {
    jest.clearAllMocks();
    users.set([user(1, 'gerente.general', 'encargado'), user(2, 'ana.centro', 'cajero'), user(3, 'carlos.centro', 'cajero', false)]);
    TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ Plus, Save, ShieldCheck, Users })),
        { provide: UsersFacade, useValue: usersFacade },
      ],
    });
    toast = TestBed.inject(ToastService);
    jest.spyOn(toast, 'success');
    jest.spyOn(toast, 'error');
    fixture = TestBed.createComponent(CashiersManagementPageComponent);
    fixture.detectChanges();
  });

  it('carga usuarios y lista solo cajeros reales (sin encargados ni maqueta)', () => {
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(1);
    const rows = el().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(el().textContent).toContain('ana.centro');
    expect(el().textContent).not.toContain('gerente.general');
    expect(el().textContent).not.toContain('Ana Lira');
    expect(rows[1].textContent).toContain('Inactivo');
  });

  it('no crea con el formulario inválido', () => {
    submit();
    expect(usersFacade.createUser).not.toHaveBeenCalled();
  });

  it('formulario inválido: dice qué campo falta en vez de no hacer nada', () => {
    type('cashier-username', 'nuevo');
    type('cashier-password', 'Secreta123');
    submit();
    expect(usersFacade.createUser).not.toHaveBeenCalled();
    expect(el().textContent).toContain('El correo es requerido');
    expect(el().textContent).not.toContain('El usuario es requerido');

    type('cashier-email', 'nuevo');
    fixture.detectChanges();
    expect(el().textContent).toContain('Correo inválido');
  });

  it('crea cajero con la sucursal de la lista, avisa y recarga', () => {
    usersFacade.createUser.mockReturnValue(of(user(9, 'nuevo', 'cajero')));
    type('cashier-username', 'nuevo');
    type('cashier-email', 'nuevo@trt.com');
    type('cashier-password', 'Secreta123');
    submit();
    expect(usersFacade.createUser).toHaveBeenCalledWith({
      username: 'nuevo', email: 'nuevo@trt.com', password: 'Secreta123', isActive: true, branchId: 1, role: 'cajero',
    });
    expect(toast.success).toHaveBeenCalled();
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
  });

  it('muestra error si el alta falla', () => {
    usersFacade.createUser.mockReturnValue(throwError(() => new Error('boom')));
    type('cashier-username', 'nuevo');
    type('cashier-email', 'nuevo@trt.com');
    type('cashier-password', 'Secreta123');
    submit();
    expect(toast.error).toHaveBeenCalledWith('boom');
  });

  it('edita el correo sin exigir contraseña', () => {
    usersFacade.updateUser.mockReturnValue(of(user(2, 'ana.centro', 'cajero')));
    rowButton(0, 'Editar').click();
    fixture.detectChanges();
    type('cashier-email', 'otro@trt.com');
    submit();
    expect(usersFacade.updateUser).toHaveBeenCalledWith(2, { email: 'otro@trt.com' });
    expect(usersFacade.createUser).not.toHaveBeenCalled();
  });

  it('da de baja desactivando al cajero', () => {
    usersFacade.updateUser.mockReturnValue(of(user(2, 'ana.centro', 'cajero', false)));
    rowButton(0, 'Dar de baja').click();
    expect(usersFacade.updateUser).toHaveBeenCalledWith(2, { isActive: false });
    expect(usersFacade.loadUsers).toHaveBeenCalledTimes(2);
  });
});
