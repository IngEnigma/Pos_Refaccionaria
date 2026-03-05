import { ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoggerService } from '@app/core/logging/logger.service';
import { LoginUseCase } from '@features/auth/application/usecase/login.usecase';
import { InputComponent } from '@app/shared/components/ui/input/input.component';
import { ButtonComponent } from '@app/shared/components/ui/button/button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly backgroundImagePath = 'assets/images/Refaccionaria.webp';
  readonly logoPath = 'assets/images/Logo_Grande.webp';

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isDisabled = computed(() => this.loading() || this.loginForm.invalid);

  private readonly logger = inject(LoggerService).withContext('LoginComponent');
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.logger.warn("Formulario inválido");
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.loginUseCase.execute(credentials).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/sales');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'Error de autenticación');
      }
    });
  }

  get usernameCtrl() {
    return this.loginForm.controls.username;
  }

  get passwordCtrl() {
    return this.loginForm.controls.password;
  }
}
