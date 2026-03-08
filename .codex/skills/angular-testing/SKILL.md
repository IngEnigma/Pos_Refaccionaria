---
name: Angular Testing
description: Use when creating, improving, or auditing tests in Angular projects including unit tests, integration tests, TestBed configuration, mocking services, and testing components, services, and guards.
---

# Skill: Angular Testing

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se creen o modifiquen servicios, facades o stores (generar test unitario)
- Se creen formularios (generar test de validaciones y submit)
- Se creen guards o resolvers (generar test)
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
70% → Unit tests (servicios, facades, stores, pipes, utils)
20% → Integration tests (componentes con dependencias)
10% → E2E tests (flujos críticos de negocio)
```

### Qué testear SIEMPRE

- ✅ Lógica de negocio en servicios / facades / stores
- ✅ Validaciones de formularios y comportamiento de submit
- ✅ Guards (acceso permitido / denegado)
- ✅ Pipes con transformaciones
- ✅ Flujos críticos E2E (login, checkout, creación de entidades)

### Qué puedes omitir

- ❌ Componentes puramente presentacionales sin lógica
- ❌ Interfaces y modelos simples
- ❌ Configuración de rutas sin lógica

---

## Testing de Servicios con HTTP

```typescript
// user.service.spec.ts
import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("UserService", () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify()); // Falla si quedan requests sin resolver

  it("retorna lista de usuarios mapeados", () => {
    const mockDTOs: UserDTO[] = [{ id: "1", first_name: "Ana", last_name: "García", email_address: "ana@test.com", is_admin: true }];

    service.getAll().subscribe((users) => {
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("Ana García");
      expect(users[0].role).toBe(UserRole.Admin);
    });

    const req = httpMock.expectOne("/api/users");
    expect(req.request.method).toBe("GET");
    req.flush(mockDTOs);
  });

  it("maneja error 500 correctamente", () => {
    service.getAll().subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    httpMock.expectOne("/api/users").flush("Error", {
      status: 500,
      statusText: "Internal Server Error",
    });
  });
});
```

---

## Testing de Services con Signals

```typescript
// cart.service.spec.ts
describe("CartService", () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  it("agrega un item al carrito", () => {
    const product = { id: "1", name: "Laptop", price: 999 };

    TestBed.runInInjectionContext(() => service.addItem(product));

    expect(service.items()).toHaveLength(1);
    expect(service.total()).toBe(999);
    expect(service.isEmpty()).toBe(false);
  });

  it("incrementa cantidad si el producto ya existe", () => {
    const product = { id: "1", name: "Mouse", price: 25 };

    TestBed.runInInjectionContext(() => {
      service.addItem(product);
      service.addItem(product);
    });

    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].qty).toBe(2);
    expect(service.total()).toBe(50);
  });

  it("elimina un item", () => {
    const product = { id: "1", name: "Teclado", price: 79 };

    TestBed.runInInjectionContext(() => {
      service.addItem(product);
      service.removeItem("1");
    });

    expect(service.items()).toHaveLength(0);
    expect(service.isEmpty()).toBe(true);
  });
});
```

---

## Testing de Componentes con Testing Library

```typescript
// user-card.component.spec.ts
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

const mockUser: User = {
  id: "1",
  name: "Ana García",
  email: "ana@test.com",
  role: UserRole.Admin,
};

describe("UserCardComponent", () => {
  it("muestra nombre y email del usuario", async () => {
    await render(UserCardComponent, { inputs: { user: mockUser } });

    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("ana@test.com")).toBeInTheDocument();
  });

  it("emite evento al hacer click en editar", async () => {
    const user = userEvent.setup();
    const editSpy = jest.fn();

    await render(UserCardComponent, {
      inputs: { user: mockUser },
      on: { editClicked: editSpy },
    });

    await user.click(screen.getByRole("button", { name: /editar/i }));
    expect(editSpy).toHaveBeenCalledWith(mockUser);
  });
});
```

---

## Testing de Componentes con Spectator

```typescript
// user-form.component.spec.ts
import { createComponentFactory, Spectator } from "@ngneat/spectator/jest";

describe("UserFormComponent", () => {
  let spectator: Spectator<UserFormComponent>;

  const createComponent = createComponentFactory({
    component: UserFormComponent,
    mocks: [UserService],
    detectChanges: false,
  });

  beforeEach(() => (spectator = createComponent()));

  it("deshabilita submit cuando el formulario es inválido", () => {
    spectator.detectChanges();
    expect(spectator.query("button[type=submit]")).toBeDisabled();
  });

  it("llama a userService.create al hacer submit con datos válidos", () => {
    const userService = spectator.inject(UserService);
    userService.create.mockReturnValue(of({ id: "1" } as User));

    spectator.typeInElement("test@test.com", '[data-testid="email"]');
    spectator.typeInElement("ValidPass123", '[data-testid="password"]');
    spectator.click("button[type=submit]");

    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({ email: "test@test.com" }));
  });
});
```

---

## Testing de Guards

```typescript
// auth.guard.spec.ts
describe("authGuard", () => {
  it("permite acceso cuando el usuario está autenticado", () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isLoggedIn: () => signal(true) } }, provideRouter([])],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it("redirige a /login cuando no está autenticado", () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isLoggedIn: () => signal(false) } }, provideRouter([])],
    });

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)) as UrlTree;

    expect(result.toString()).toBe("/login");
  });
});
```

---

## Testing de NgRx Signal Store

```typescript
// product.store.spec.ts
describe("ProductStore", () => {
  let store: InstanceType<typeof ProductStore>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(() => {
    productService = { getAll: jest.fn(), create: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [ProductStore, { provide: ProductService, useValue: productService }],
    });

    store = TestBed.inject(ProductStore);
  });

  it("carga productos y actualiza estado", fakeAsync(() => {
    const mockProducts: Product[] = [{ id: "1", name: "Widget", price: 10 }];
    productService.getAll.mockReturnValue(of(mockProducts));

    store.loadProducts();
    tick();

    expect(store.products()).toEqual(mockProducts);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  }));

  it("maneja error al cargar", fakeAsync(() => {
    productService.getAll.mockReturnValue(throwError(() => new Error("Server error")));

    store.loadProducts();
    tick();

    expect(store.products()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe("Server error");
  }));
});
```

---

## E2E con Playwright

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("usuario puede hacer login exitosamente", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@empresa.com");
    await page.getByLabel("Contraseña").fill("SecurePass123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
  });

  test("muestra error con credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@email.com");
    await page.getByLabel("Contraseña").fill("wrongpassword");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByRole("alert")).toContainText("Credenciales incorrectas");
    await expect(page).toHaveURL("/login"); // No redirigió
  });

  test("redirige a login si no está autenticado", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});
```

---

## Configuración de Jest

```json
// jest.config.js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterFramework: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    }
  }
};
```

```typescript
// setup-jest.ts
import "jest-preset-angular/setup-jest";
import "@testing-library/jest-dom";
```
