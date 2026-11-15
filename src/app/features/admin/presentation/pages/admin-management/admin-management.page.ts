import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule } from 'lucide-angular';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { BranchesFacade } from '@features/branches/application/facades/branches.facade';
import { ConfirmDialogComponent } from '@app/shared/ui/components/confirm-dialog/confirm-dialog.component';
import { User } from '@features/users/domain/entities/user.entity';
import { branchFieldValidators } from '@features/branches/presentation/validators/branch-form.validators';
import { UsersFacade } from '@features/users/application/facades/users.facade';

@Component({
  selector: 'app-admin-management-page',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './admin-management.page.html',
  styleUrl: './admin-management.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminManagementPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly branchesFacade = inject(BranchesFacade);
  private readonly usersFacade = inject(UsersFacade);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly branches = this.branchesFacade.branches;
  readonly users = this.usersFacade.users;
  readonly branchesLoading = this.branchesFacade.loading;
  readonly usersLoading = this.usersFacade.loading;
  readonly activeUsers = computed(() => this.users().filter((u) => u.isActive).length);

  readonly branchForm = this.fb.group({
    nombreSucursal: ['', branchFieldValidators.nombreSucursal],
    ubicacion: ['', branchFieldValidators.ubicacion],
    codigoPostal: ['', branchFieldValidators.codigoPostal],
    numeroTelefono: ['', branchFieldValidators.numeroTelefono],
    correoElectronico: ['', branchFieldValidators.correoElectronico],
  });

  readonly userForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.branchesFacade.loadBranches();
    this.usersFacade.loadUsers();
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    this.branchesFacade
      .createBranch(this.branchForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Sucursal creada correctamente.');
          this.branchForm.reset();
          this.branchesFacade.loadBranches();
        },
        error: (error: unknown) => this.toast.error(this.messageOf(error)),
      });
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.usersFacade
      .createUser(this.userForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Usuario creado correctamente.');
          this.userForm.reset();
          this.usersFacade.loadUsers();
        },
        error: (error: unknown) => this.toast.error(this.messageOf(error)),
      });
  }

  /** H-53: el control es inválido y el usuario ya lo tocó (o intentó enviar). */
  invalid(form: FormGroup, name: string): boolean {
    const control = form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  toggleUser(user: User): void {
    this.usersFacade
      .updateUser(user.id, { isActive: !user.isActive })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterUserChange(user.isActive ? 'Usuario desactivado.' : 'Usuario activado.'),
        error: (error: unknown) => this.toast.error(this.messageOf(error)),
      });
  }

  deleteUser(user: User): void {
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar usuario',
          message: `¿Eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          variant: 'danger',
        },
      })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.usersFacade.deleteUser(user.id).subscribe({
          next: () => this.afterUserChange('Usuario eliminado.'),
          error: (error: unknown) => this.toast.error(this.messageOf(error)),
        });
      });
  }

  private afterUserChange(message: string): void {
    this.toast.success(message);
    this.usersFacade.loadUsers();
  }

  private messageOf(error: unknown): string | undefined {
    // H-48: el backend responde {"error"} / {"detail"}; HttpErrorResponse no es un Error.
    if (error instanceof HttpErrorResponse) {
      return error.error?.error || error.error?.detail || error.error?.message || undefined;
    }
    return error instanceof Error && error.message ? error.message : undefined;
  }
}
