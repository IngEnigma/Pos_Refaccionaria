import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppRoutes } from '@core/routing/app-routes';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InputComponent } from '@app/shared/ui/form-controls/input/input.component';
import { ButtonComponent } from '@app/shared/ui/form-controls/button/button.component';

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

  readonly loading = this.authFacade.loading;
  readonly errorMessage = this.authFacade.errorMessage;

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
