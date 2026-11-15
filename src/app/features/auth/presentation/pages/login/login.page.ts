import { ChangeDetectionStrategy, Component, DestroyRef, inject, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppRoutes } from '@app/app-routes';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InputComponent, ButtonComponent, ToastService } from '@shared/ui';

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
  private readonly route = inject(ActivatedRoute);
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
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });
  }

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** Desmarcada por defecto: la sesión solo se persiste en localStorage si el usuario lo pide (H-04, H-19). */
  readonly rememberCtrl = this.fb.nonNullable.control(false);

  get submitDisabled(): boolean {
    return this.loading() || this.loginForm.invalid;
  }

  onSubmit(): void {
    if (this.loading()) return;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = { ...this.loginForm.getRawValue(), remember: this.rememberCtrl.value };
    this.authFacade
      .login(credentials)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isSuccess) => {
        if (isSuccess) {
          const redirectTo = this.route.snapshot.queryParams['redirectTo'];
          // H-18: solo rutas internas ("/x"); "//host", "/\\host" o un esquema quedan fuera.
          const isInternal = typeof redirectTo === 'string' && /^\/(?![/\\])/.test(redirectTo);
          this.router.navigateByUrl(isInternal ? redirectTo : `/${AppRoutes.sales}`);
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
