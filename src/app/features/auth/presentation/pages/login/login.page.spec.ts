import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { LoginPageComponent } from './login.page';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let authFacadeSpy: jest.Mocked<Partial<AuthFacade>>;
  let loadingState: WritableSignal<boolean>;
  let errorState: WritableSignal<string | null>;

  beforeEach(async () => {
    loadingState = signal(false);
    errorState = signal<string | null>(null);

    routerSpy = {
      navigateByUrl: jest.fn(),
    };

    authFacadeSpy = {
      login: jest.fn(),
      loading: loadingState.asReadonly(),
      errorMessage: errorState.asReadonly(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        LoginPageComponent,
        LucideAngularModule.pick({ Eye, EyeOff })
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthFacade, useValue: authFacadeSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {} },
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('marks controls as touched when form is invalid', () => {
    component.onSubmit();

    expect(authFacadeSpy.login).not.toHaveBeenCalled();
    expect(component.usernameCtrl.touched).toBe(true);
    expect(component.passwordCtrl.touched).toBe(true);
  });

  it('calls facade and redirects on successful login', () => {
    (authFacadeSpy.login as jest.Mock).mockReturnValue(of(true));

    component.loginForm.setValue({
      username: 'admin',
      password: '123456',
    });

    component.onSubmit();

    expect(authFacadeSpy.login).toHaveBeenCalledWith({
      username: 'admin',
      password: '123456',
    });
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sales');
  });

  it('disables submit when loading signal is true', () => {
    component.loginForm.setValue({
      username: 'admin',
      password: '123456',
    });
    expect(component.submitDisabled).toBe(false);

    loadingState.set(true);
    expect(component.submitDisabled).toBe(true);
  });
});
