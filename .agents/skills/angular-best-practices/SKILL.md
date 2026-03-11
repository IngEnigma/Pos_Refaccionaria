---
name: angular-best-practices
description: Use when reviewing Angular code quality and applying best practices including folder structure, naming conventions, dependency injection patterns, performance optimization, and maintainable coding standards.
---

# Skill: Angular Best Practices

## Cuándo aplicar este skill

Aplica este skill en TODO el código Angular que generes o modifiques.
Es el skill base — sus reglas aplican siempre, en combinación con los demás skills.

---

## Reglas obligatorias (aplica en cada archivo que toques)

### 1. ChangeDetection siempre OnPush

```typescript
// ✅ SIEMPRE en todos los componentes
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 2. Standalone Components (no NgModules)

```typescript
// ✅ Angular 14+ — preferir standalone
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, SharedButtonComponent],
})

// ❌ Evitar NgModule cuando no sea necesario
@NgModule({ declarations: [MyComponent] }) // Solo si hay razón específica
```

### 3. inject() en vez de constructor DI

```typescript
// ✅ Moderno y limpio
export class UserComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
}

// ❌ Verboso — evitar
constructor(private userService: UserService, private router: Router) {}
```

### 4. Control flow moderno (Angular 17+)

```html
<!-- ✅ Nuevo control flow -->
@if (user()) {
<app-user-profile [user]="user()!" />
} @else {
<app-skeleton />
} @for (item of items(); track item.id) {
<app-item [item]="item" />
} @empty {
<p>Sin resultados</p>
} @switch (status()) { @case ('active') { <span class="badge-green">Activo</span> } @case ('inactive') { <span class="badge-gray">Inactivo</span> } @default { <span>Desconocido</span> } }

<!-- ❌ Evitar la sintaxis antigua -->
<div *ngIf="user">...</div>
<li *ngFor="let item of items; trackBy: trackById">...</li>
```

### 5. Input/Output como signals (Angular 17.1+)

```typescript
// ✅ Input signals
export class UserCardComponent {
  user = input.required<User>();            // obligatorio
  size = input<'sm' | 'md' | 'lg'>('md'); // con default
  theme = input<'light' | 'dark'>('light');

  // Computed desde input — reactivo automáticamente
  initials = computed(() =>
    this.user().name.split(' ').map(n => n[0]).join('').toUpperCase()
  );
}

// ✅ Output signal
export class SearchComponent {
  search = output<string>();
  clear = output<void>();

  onSearch(query: string): void { this.search.emit(query); }
}

// ✅ model() para two-way binding
export class ToggleComponent {
  checked = model(false); // permite [(checked)]="myValue"
}

// ❌ Evitar la sintaxis antigua cuando sea posible
@Input() user!: User;
@Output() search = new EventEmitter<string>();
```

### 6. Signals para estado local

```typescript
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  isPositive = computed(() => this.count() > 0);

  increment(): void {
    this.count.update((c) => c + 1);
  }
  reset(): void {
    this.count.set(0);
  }

  // effect() para side effects reactivos (con auto-cleanup)
  private logEffect = effect(() => {
    console.log("Count:", this.count()); // Se re-ejecuta cuando cambia count
  });
}
```

### 7. Evitar memory leaks

```typescript
// ✅ takeUntilDestroyed (Angular 16+) — recomendado
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.service.data$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => this.data.set(data));
}

// ✅ toSignal — se auto-limpia
data = toSignal(this.service.data$, { initialValue: [] });

// ✅ async pipe en template — se auto-limpia
// template: {{ data$ | async }}

// ❌ NUNCA dejar suscripciones sin cerrar
ngOnInit(): void {
  this.service.data$.subscribe(d => this.data = d); // MEMORY LEAK
}
```

---

## Formularios Reactivos Tipados

```typescript
// ✅ Tipado estricto — nonNullable por defecto
interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}

export class LoginComponent {
  form = new FormGroup<LoginForm>({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  });

  // Acceso tipado a controles
  get emailCtrl() {
    return this.form.controls.email;
  }
  get passwordCtrl() {
    return this.form.controls.password;
  }

  submit(): void {
    if (this.form.valid) {
      const { email, password, rememberMe } = this.form.getRawValue(); // tipado!
    }
  }
}
```

---

## Configuración obligatoria del proyecto

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Path aliases en tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@env/*": ["src/environments/*"]
    }
  }
}
```

---

## Convenciones de Naming

```
# Archivos (kebab-case con sufijo)
user.component.ts        user.service.ts
user.facade.ts           user.repository.ts
user.store.ts            user.model.ts
user.pipe.ts             user.directive.ts
user.guard.ts            user.routes.ts
user.resolver.ts         user.interceptor.ts

# Clases (PascalCase con sufijo)
UserComponent, UserService, UserFacade
UserStore, UserRepository, UserGuard

# Interfaces y tipos (PascalCase, SIN prefijo "I")
User, UserRole, UserFilters, CreateUserDto   ✅
IUser, IUserRole                              ❌

# Signals y computeds (camelCase, sin sufijo $)
users, loading, selectedUser, totalCount      ✅

# Observables (camelCase con sufijo $)
users$, loading$, selectedUser$              ✅
```

---

## Performance — Reglas clave

```typescript
// ✅ track por id en @for (evita re-render innecesario)
@for (user of users(); track user.id) { ... }

// ✅ @defer para componentes pesados (Angular 17+)
@defer (on viewport) {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="skeleton h-64 rounded-lg animate-pulse"></div>
} @loading (minimum 300ms) {
  <app-spinner />
}

// ✅ Imágenes optimizadas
import { NgOptimizedImage } from '@angular/common';
// <img ngSrc="avatar.jpg" width="64" height="64" alt="..." />
// <img ngSrc="hero.jpg" width="1200" height="600" priority alt="..." />

// ✅ Lazy loading en rutas
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent)
}
```

---

## Checklist de Code Review

### Componentes

- [ ] `ChangeDetectionStrategy.OnPush` presente
- [ ] `standalone: true` (sin NgModule innecesario)
- [ ] `inject()` en vez de constructor DI
- [ ] `input()` / `output()` signals en vez de `@Input()` / `@Output()`
- [ ] `@if` / `@for` con `track` en vez de `*ngIf` / `*ngFor`
- [ ] Sin lógica de negocio en el template o componente
- [ ] Sin `any` sin justificación

### Servicios y Estado

- [ ] Estado privado, acceso readonly
- [ ] Sin suscripciones sin cleanup
- [ ] Errores manejados explícitamente

### General

- [ ] `strict: true` en tsconfig
- [ ] Sin `console.log` en código de producción
- [ ] Barrel files (`index.ts`) en features

---

## Anti-patrones — NUNCA hacer esto

```typescript
// ❌ Manipular DOM directamente
document.getElementById('btn').style.color = 'red';
// ✅ Usar Renderer2 o class bindings

// ❌ Subscribe dentro de subscribe
this.service.getUser().subscribe(user => {
  this.service.getPosts(user.id).subscribe(posts => { ... });
});
// ✅ Usar switchMap
this.service.getUser().pipe(
  switchMap(user => this.service.getPosts(user.id))
).subscribe(posts => { ... });

// ❌ Tipado con any
getData(): any { return this.http.get('/api/data'); }
// ✅ Tipado explícito
getData(): Observable<Product[]> { return this.http.get<Product[]>('/api/data'); }

// ❌ Lógica compleja en template
{{ users.filter(u => u.active).sort((a,b) => a.name.localeCompare(b.name)).length }}
// ✅ Computed signal
activeUsersCount = computed(() =>
  this.users().filter(u => u.active).length
);
```
