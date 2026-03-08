import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { LoginPageComponent } from './login.page';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authFacadeSpy: jasmine.SpyObj<AuthFacade>;
  let loadingState: WritableSignal<boolean>;
  let errorState: WritableSignal<string | null>;

  beforeEach(async () => {
    loadingState = signal(false);
    errorState = signal<string | null>(null);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    authFacadeSpy = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['login']);

    Object.defineProperties(authFacadeSpy, {
      loading: {
        value: loadingState.asReadonly(),
      },
      errorMessage: {
        value: errorState.asReadonly(),
      },
    });

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthFacade, useValue: authFacadeSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('marks controls as touched when form is invalid', () => {
    component.onSubmit();

    expect(authFacadeSpy.login).not.toHaveBeenCalled();
    expect(component.usernameCtrl.touched).toBeTrue();
    expect(component.passwordCtrl.touched).toBeTrue();
  });

  it('calls facade and redirects on successful login', () => {
    authFacadeSpy.login.and.returnValue(of(true));

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
    expect(component.submitDisabled).toBeFalse();

    loadingState.set(true);
    expect(component.submitDisabled).toBeTrue();
  });
});
