import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ToastService } from '@shared/ui';
import { LoginPageComponent } from './login.page';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let authFacadeSpy: jest.Mocked<Partial<AuthFacade>>;
  let loadingState: WritableSignal<boolean>;
  let errorState: WritableSignal<string | null>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    queryParams = {};
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
            snapshot: { get queryParams() { return queryParams; } },
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

  describe('envío del formulario', () => {
    const credentials = { username: 'cajero', password: 'secreta' };

    function submitButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('button[type="submit"]');
    }

    function fillAndSubmit(): void {
      component.loginForm.setValue(credentials);
      fixture.detectChanges();
      submitButton().click();
    }

    it('con el formulario vacío el botón "Ingresar" está deshabilitado', () => {
      expect(submitButton().disabled).toBe(true);
    });

    it('con usuario y contraseña el botón se habilita y el clic envía las credenciales', () => {
      (authFacadeSpy.login as jest.Mock).mockReturnValue(of(true));
      component.loginForm.setValue(credentials);
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(false);

      submitButton().click();

      expect(authFacadeSpy.login).toHaveBeenCalledTimes(1);
      expect(authFacadeSpy.login).toHaveBeenCalledWith(credentials);
    });

    it('no envía "remember": la pantalla no ofrece recordar sesión', () => {
      (authFacadeSpy.login as jest.Mock).mockReturnValue(of(true));

      fillAndSubmit();

      expect((authFacadeSpy.login as jest.Mock).mock.calls[0][0]).not.toHaveProperty('remember');
    });

    it('mientras carga el botón queda deshabilitado y marcado como ocupado (no hay doble envío)', () => {
      component.loginForm.setValue(credentials);
      loadingState.set(true);
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(true);
      expect(submitButton().getAttribute('aria-busy')).toBe('true');

      submitButton().click();
      expect(authFacadeSpy.login).not.toHaveBeenCalled();
    });

    it('al terminar la carga el botón vuelve a habilitarse', () => {
      component.loginForm.setValue(credentials);
      loadingState.set(true);
      fixture.detectChanges();

      loadingState.set(false);
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(false);
    });

    it('mientras la petición sigue en curso no navega', () => {
      (authFacadeSpy.login as jest.Mock).mockReturnValue(new Subject<boolean>());

      fillAndSubmit();

      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('credenciales rechazadas (facade emite false): no navega', () => {
      (authFacadeSpy.login as jest.Mock).mockReturnValue(of(false));

      fillAndSubmit();

      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it.todo('H-20: onSubmit() ignora un segundo envío mientras loading() es true (hoy solo lo evita el botón deshabilitado)');
  });

  describe('redirección tras el login', () => {
    beforeEach(() => {
      (authFacadeSpy.login as jest.Mock).mockReturnValue(of(true));
      component.loginForm.setValue({ username: 'admin', password: '123456' });
    });

    it('sin redirectTo va a /sales', () => {
      component.onSubmit();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sales');
    });

    it('con redirectTo navega a esa ruta', () => {
      queryParams = { redirectTo: '/inventory' };

      component.onSubmit();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/inventory');
    });

    it('conserva query params del redirectTo', () => {
      queryParams = { redirectTo: '/sales?q=filtro' };

      component.onSubmit();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sales?q=filtro');
    });

    it.todo('H-18: valida redirectTo (solo rutas internas que empiecen con "/" y no con "//" ni con esquema)');
  });

  describe('errores de autenticación', () => {
    let toast: ToastService;

    beforeEach(() => {
      toast = TestBed.inject(ToastService);
      jest.spyOn(toast, 'error').mockImplementation(() => undefined as never);
    });

    it.each([
      ['credenciales inválidas (401)', 'Credenciales inválidas'],
      ['sin red', 'Error de red. Verifica tu conexión.'],
      ['error del servidor (500)', 'Error desconocido'],
    ])('%s: muestra el mensaje del facade en un toast', (_caso, message) => {
      errorState.set(message);
      fixture.detectChanges();

      expect(toast.error).toHaveBeenCalledWith(message);
    });

    it('sin error no muestra toast', () => {
      fixture.detectChanges();

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('tras un error el usuario puede corregir y volver a enviar', () => {
      errorState.set('Credenciales inválidas');
      (authFacadeSpy.login as jest.Mock).mockReturnValue(of(true));
      component.loginForm.setValue({ username: 'admin', password: 'correcta' });

      component.onSubmit();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sales');
    });
  });

  // H-43: con el ToastService real (sin mock) el effect no debe lanzar NG0600 y el aviso debe llegar a la pantalla.
  describe('toast real del error de autenticación', () => {
    it('credenciales inválidas: el toast de error queda visible en el ToastService', () => {
      errorState.set('Credenciales inválidas');
      fixture.detectChanges();
      TestBed.flushEffects();

      const toasts = TestBed.inject(ToastService).toasts();
      expect(toasts.map((t) => [t.type, t.message])).toEqual([['error', 'Credenciales inválidas']]);
    });
  });

  describe('accesibilidad y mensajes de validación', () => {
    it('muestra "El usuario es requerido" y "La contraseña es requerida" tras intentar enviar vacío', () => {
      component.onSubmit();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('El usuario es requerido');
      expect(text).toContain('La contraseña es requerida');
    });

    it('el campo contraseña es de tipo password', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

      expect(Array.from(inputs).some((i) => i.type === 'password')).toBe(true);
    });

    it.todo('H-19: la pantalla ofrece "Recordar sesión" y envía remember (hoy LoginCommand.remember nunca se usa desde la UI)');
  });
});
