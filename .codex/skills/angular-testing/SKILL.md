---
name: Angular Testing
description: Use when creating, improving, or auditing tests in Angular projects including unit tests, integration tests, TestBed configuration, mocking services, testing components, services, guards, and Angular 17+ features like @defer blocks, input() signals, and resource(). Compatible with Angular 17+.
---

# Skill: Angular Testing
> Angular 17+ | Jest + Testing Library + Spectator

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se creen o modifiquen servicios, facades o stores (generar test unitario)
- Se creen formularios (generar test de validaciones y submit)
- Se creen guards o resolvers (generar test)
- Se usen `@defer`, `input()` signals, o `resource()` (ver secciones dedicadas)
- El usuario pida tests, specs, o cobertura
- Se mencione "unit test", "e2e", "jest", "testing library", "spec"

---

## Setup recomendado

```bash
# Jest (más rápido que Karma)
ng add jest-preset-angular

# Testing Library (queries semánticas — tests más resilientes)
npm install -D @testing-library/angular @testing-library/user-event @testing-library/jest-dom

# Spectator (simplifica TestBed para componentes y servicios)
npm install -D @ngneat/spectator/jest
```

---

## Estrategia de testing

```
70% → Unit tests (facades, stores, servicios, pipes, utils — el núcleo más importante)
20% → Integration tests (componentes con dependencias reales o parciales)
10% → E2E tests (flujos críticos de negocio)
```

### Qué testear SIEMPRE

- ✅ **Facades y Stores** — son el núcleo, aquí vive la lógica de negocio
- ✅ Servicios con lógica (HTTP, transformaciones, side effects)
- ✅ Validaciones de formularios y comportamiento de submit
- ✅ Guards (acceso permitido / denegado)
- ✅ Pipes con transformaciones
- ✅ Flujos críticos E2E (login, checkout, creación de entidades)

### Qué puedes omitir

- ❌ Componentes puramente presentacionales sin lógica
- ❌ Interfaces y modelos simples
- ❌ Configuración de rutas sin lógica

---

## Configuración de Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'], // ✅ key correcta
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches:   60,
      functions:  70,
      lines:      70,
    }
  }
};
```

```typescript
// setup-jest.ts
import 'jest-preset-angular/setup-jest';
import '@testing-library/jest-dom';
```

---

## Testing de Servicios con HTTP

```typescript
// user.service.spec.ts
import { TestBed }                                         from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient }                               from '@angular/common/http';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify()); // Falla si quedan requests sin resolver

  it('retorna lista de usuarios mapeados', () => {
    const mockDTOs: UserDTO[] = [{
      id: '1', first_name: 'Ana', last_name: 'García',
      email_address: 'ana@test.com', is_admin: true,
    }];

    service.getAll().subscribe(users => {
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Ana García');
      expect(users[0].role).toBe(UserRole.Admin);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockDTOs);
  });

  it('maneja error 500 correctamente', () => {
    service.getAll().subscribe({
      error: err => expect(err.status).toBe(500),
    });
    httpMock.expectOne('/api/users').flush('Error', {
      status: 500, statusText: 'Internal Server Error',
    });
  });
});
```

---

## Testing de Services con Signals

```typescript
// cart.service.spec.ts
describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  it('agrega un item al carrito', () => {
    const product = { id: '1', name: 'Laptop', price: 999 };

    TestBed.runInInjectionContext(() => service.addItem(product));

    expect(service.items()).toHaveLength(1);
    expect(service.total()).toBe(999);
    expect(service.isEmpty()).toBe(false);
  });

  it('incrementa cantidad si el producto ya existe', () => {
    const product = { id: '1', name: 'Mouse', price: 25 };

    TestBed.runInInjectionContext(() => {
      service.addItem(product);
      service.addItem(product);
    });

    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].qty).toBe(2);
    expect(service.total()).toBe(50);
  });

  it('elimina un item', () => {
    const product = { id: '1', name: 'Teclado', price: 79 };

    TestBed.runInInjectionContext(() => {
      service.addItem(product);
      service.removeItem('1');
    });

    expect(service.items()).toHaveLength(0);
    expect(service.isEmpty()).toBe(true);
  });
});
```

---

## Testing de input() signals (Angular 17.1+)

```typescript
// Con Testing Library — usar ComponentRef.setInput()
import { render, screen } from '@testing-library/angular';

describe('UserCardComponent', () => {
  const mockUser: User = {
    id: '1', name: 'Ana García', email: 'ana@test.com', role: UserRole.Admin,
  };

  it('muestra nombre y email del usuario', async () => {
    // ✅ Pasar inputs como objeto plano en render()
    await render(UserCardComponent, {
      inputs: { user: mockUser }, // Funciona con input() signals
    });

    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('ana@test.com')).toBeInTheDocument();
  });

  it('actualiza cuando cambia el input', async () => {
    const { fixture } = await render(UserCardComponent, {
      inputs: { user: mockUser },
    });

    // ✅ Actualizar un input signal con setInput()
    fixture.componentRef.setInput('user', { ...mockUser, name: 'Carlos López' });
    fixture.detectChanges();

    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('emite evento al hacer click en editar', async () => {
    const user = userEvent.setup();
    const editSpy = jest.fn();

    await render(UserCardComponent, {
      inputs: { user: mockUser },
      on: { editClicked: editSpy },
    });

    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(editSpy).toHaveBeenCalledWith(mockUser);
  });
});
```

---

## Testing de @defer blocks (Angular 17+)

```typescript
import { TestBed, DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';

@Component({
  standalone: true,
  template: `
    @defer (on viewport) {
      <app-heavy-chart />
    } @placeholder {
      <div data-testid="placeholder">Cargando gráfico...</div>
    } @loading {
      <div data-testid="loading">Preparando...</div>
    } @error {
      <div data-testid="error">Error al cargar</div>
    }
  `,
})
class PageWithDeferComponent {}

describe('PageWithDeferComponent — @defer', () => {
  // Modo manual: controla los bloques defer explícitamente
  beforeEach(() => {
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
  });

  it('muestra el placeholder inicialmente', async () => {
    await render(PageWithDeferComponent);
    expect(screen.getByTestId('placeholder')).toBeInTheDocument();
  });

  it('muestra el contenido diferido después de resolver', async () => {
    const { fixture } = await render(PageWithDeferComponent);
    const deferBlocks  = await fixture.getDeferBlocks();

    // Avanzar al estado de loading
    await deferBlocks[0].render(DeferBlockState.Loading);
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Avanzar al estado completo (contenido real)
    await deferBlocks[0].render(DeferBlockState.Complete);
    expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
  });

  it('muestra el bloque de error cuando falla', async () => {
    const { fixture } = await render(PageWithDeferComponent);
    const deferBlocks  = await fixture.getDeferBlocks();

    await deferBlocks[0].render(DeferBlockState.Error);
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });
});
```

---

## Testing de Facades (núcleo más importante)

```typescript
// user.facade.spec.ts
describe('UserFacade', () => {
  let facade: UserFacade;
  let repo: jest.Mocked<GetUsersUseCase>;

  beforeEach(() => {
    repo = { execute: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        UserFacade,
        { provide: GetUsersUseCase, useValue: repo },
      ],
    });

    facade = TestBed.inject(UserFacade);
  });

  it('estado inicial correcto', () => {
    expect(facade.users()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('carga usuarios correctamente', fakeAsync(() => {
    const mockUsers: User[] = [{ id: '1', name: 'Ana', email: 'ana@test.com', role: UserRole.Viewer }];
    repo.execute.mockReturnValue(of(mockUsers));

    facade.loadUsers();
    tick();

    expect(facade.users()).toEqual(mockUsers);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
    expect(facade.totalUsers()).toBe(1);
  }));

  it('maneja errores y actualiza estado de error', fakeAsync(() => {
    repo.execute.mockReturnValue(throwError(() => new Error('Network error')));

    facade.loadUsers();
    tick();

    expect(facade.users()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBe('Network error');
    expect(facade.hasError()).toBe(true);
  }));

  it('loading es true mientras carga', fakeAsync(() => {
    repo.execute.mockReturnValue(NEVER); // nunca resuelve
    facade.loadUsers();

    expect(facade.loading()).toBe(true);
  }));
});
```

---

## Testing de Componentes con Spectator

```typescript
// user-form.component.spec.ts
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';

describe('UserFormComponent', () => {
  let spectator: Spectator<UserFormComponent>;

  const createComponent = createComponentFactory({
    component:     UserFormComponent,
    mocks:         [UserService],
    detectChanges: false,
  });

  beforeEach(() => (spectator = createComponent()));

  it('deshabilita submit cuando el formulario es inválido', () => {
    spectator.detectChanges();
    expect(spectator.query('button[type=submit]')).toBeDisabled();
  });

  it('llama a userService.create al hacer submit con datos válidos', () => {
    const userService = spectator.inject(UserService);
    userService.create.mockReturnValue(of({ id: '1' } as User));

    // ✅ Preferir userEvent sobre typeInElement (typeInElement está deprecado)
    const user = userEvent.setup();
    await user.type(spectator.query('[data-testid="email"]')!, 'test@test.com');
    await user.type(spectator.query('[data-testid="password"]')!, 'ValidPass123');

    spectator.click('button[type=submit]');

    expect(userService.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@test.com' })
    );
  });
});
```

---

## Testing de Guards

```typescript
// auth.guard.spec.ts
describe('authGuard', () => {
  it('permite acceso cuando el usuario está autenticado', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => signal(true) } },
        provideRouter([]),
      ],
    });

    const result = TestBed.runInInjectionContext(
      () => authGuard({} as any, {} as any)
    );
    expect(result).toBe(true);
  });

  it('redirige a /login cuando no está autenticado', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => signal(false) } },
        provideRouter([]),
      ],
    });

    const result = TestBed.runInInjectionContext(
      () => authGuard({} as any, {} as any)
    ) as UrlTree;

    expect(result.toString()).toBe('/login');
  });
});
```

---

## Testing de NgRx Signal Store

```typescript
// product.store.spec.ts
describe('ProductStore', () => {
  let store: InstanceType<typeof ProductStore>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(() => {
    productService = { getAll: jest.fn(), create: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        ProductStore,
        { provide: ProductService, useValue: productService },
      ],
    });

    store = TestBed.inject(ProductStore);
  });

  it('carga productos y actualiza estado', fakeAsync(() => {
    const mockProducts: Product[] = [{ id: '1', name: 'Widget', price: 10 }];
    productService.getAll.mockReturnValue(of(mockProducts));

    store.loadProducts();
    tick();

    expect(store.products()).toEqual(mockProducts);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  }));

  it('maneja error al cargar', fakeAsync(() => {
    productService.getAll.mockReturnValue(throwError(() => new Error('Server error')));

    store.loadProducts();
    tick();

    expect(store.products()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Server error');
  }));
});
```

---

## Testing de resource() (Angular 19+)

```typescript
// user-detail.component.spec.ts
import { TestBed, fakeAsync, tick, flushEffects } from '@angular/core/testing';
import { provideHttpClient }                       from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('UserDetailComponent — resource()', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:   [UserDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carga el usuario y actualiza el resource', fakeAsync(() => {
    const { fixture } = TestBed.createComponent(UserDetailComponent);
    fixture.componentRef.setInput('userId', '42');
    fixture.detectChanges();

    // Ejecutar effects (resource lanza la petición en un effect)
    flushEffects();

    const req = httpMock.expectOne('/api/users/42');
    req.flush({ id: '42', name: 'Ana García', email: 'ana@test.com' });

    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.userResource.value()?.name).toBe('Ana García');
    expect(component.userResource.isLoading()).toBe(false);
    expect(component.userResource.error()).toBeUndefined();
  }));

  it('muestra error cuando la petición falla', fakeAsync(() => {
    const { fixture } = TestBed.createComponent(UserDetailComponent);
    fixture.componentRef.setInput('userId', '99');
    fixture.detectChanges();

    flushEffects();

    const req = httpMock.expectOne('/api/users/99');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    tick();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.userResource.error()).toBeTruthy();
    expect(component.userResource.value()).toBeUndefined();
  }));
});
```

---

## E2E con Playwright

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('usuario puede hacer login exitosamente', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('admin@empresa.com');
    await page.getByLabel('Contraseña').fill('SecurePass123');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /bienvenido/i })).toBeVisible();
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@email.com');
    await page.getByLabel('Contraseña').fill('wrongpassword');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toContainText('Credenciales incorrectas');
    await expect(page).toHaveURL('/login');
  });

  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Errores comunes en code review

| Error | Por qué es problema | Solución |
|-------|---------------------|----------|
| `typeInElement` de Spectator | Deprecado, se elimina en versiones futuras | Usar `userEvent` de Testing Library |
| `setupFilesAfterFramework` en jest.config | Typo — key incorrecta, Jest lo ignora | Cambiar a `setupFilesAfterEnv` |
| No testear Facades | Son el núcleo de la lógica, los más críticos | Siempre testear: estados inicial, éxito, error |
| `fixture.detectChanges()` sin `flushEffects()` para `resource()` | El resource no dispara sin flush | Llamar `flushEffects()` antes de `tick()` |
| No usar `setInput()` para `input()` signals | Asignar propiedades directas no dispara el signal | Usar `fixture.componentRef.setInput('key', value)` |
| No testear bloque `@error` del `@defer` | Estado de error ignorado en pruebas | Probar los 4 estados: placeholder, loading, complete, error |
