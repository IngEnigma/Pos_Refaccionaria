import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Observable } from 'rxjs';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { UsersFacade } from '@features/users/application/facades/users.facade';
import { User } from '@features/users/domain/entities/user.entity';

@Component({
  selector: 'app-cashiers-management-page',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './cashiers-management.page.html',
  styleUrl: './cashiers-management.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashiersManagementPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usersFacade = inject(UsersFacade);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** El back ya limita la lista a la sucursal del encargado; aquí solo se quitan los no cajeros. */
  readonly cashiers = computed(() => this.usersFacade.users().filter((u) => u.role === 'cajero'));
  readonly editing = signal<User | null>(null);

  readonly form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  invalid(name: 'username' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  ngOnInit(): void {
    this.usersFacade.loadUsers();
  }

  edit(user: User): void {
    this.editing.set(user);
    this.form.reset({ username: user.username, email: user.email, password: '' });
    this.form.controls.username.disable();
    this.form.controls.password.removeValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
  }

  clear(): void {
    this.editing.set(null);
    this.form.reset();
    this.form.controls.username.enable();
    this.form.controls.password.addValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, email, password } = this.form.getRawValue();
    const target = this.editing();
    if (target) {
      this.run(this.usersFacade.updateUser(target.id, { email, ...(password && { password }) }), 'Cajero actualizado.');
      return;
    }
    // El back fuerza rol cajero y la sucursal del encargado; branchId solo cumple el contrato (todos comparten sucursal).
    const branchId = this.usersFacade.users()[0]?.branchId ?? 0;
    this.run(this.usersFacade.createUser({ username, email, password, isActive: true, branchId, role: 'cajero' }), 'Cajero creado.');
  }

  deactivate(user: User): void {
    this.run(this.usersFacade.updateUser(user.id, { isActive: false }), 'Cajero dado de baja.', false);
  }

  private run(request: Observable<User>, message: string, resetForm = true): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success(message);
        if (resetForm) this.clear();
        this.usersFacade.loadUsers();
      },
      error: (error: unknown) => this.toast.error(this.messageOf(error)),
    });
  }

  private messageOf(error: unknown): string | undefined {
    // H-48: el backend responde {"error"} / {"detail"}; HttpErrorResponse no es un Error.
    if (error instanceof HttpErrorResponse) {
      return error.error?.error || error.error?.detail || error.error?.message || undefined;
    }
    return error instanceof Error && error.message ? error.message : undefined;
  }
}
