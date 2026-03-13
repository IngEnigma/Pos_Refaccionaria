import { ChangeDetectionStrategy, Component, DestroyRef, inject, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/app-routes';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InputComponent } from '@app/shared/ui/form-controls/input/input.component';
import { ButtonComponent } from '@app/shared/ui/form-controls/button/button.component';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent, NgOptimizedImage],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly backgroundImagePath = 'assets/images/Refaccionaria.webp';
  readonly logoPath = 'assets/images/Logo_Grande.webp';

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly loading = this.authFacade.loading;
  readonly errorMessage = this.authFacade.errorMessage;

  constructor() {
    effect(() => {
      const errorMsg = this.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  get submitDisabled(): boolean {
    return this.loading() || this.loginForm.invalid;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();
    this.authFacade
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isSuccess) => {
        if (isSuccess) {
          this.router.navigateByUrl(`/${AppRoutes.sales}`);
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
