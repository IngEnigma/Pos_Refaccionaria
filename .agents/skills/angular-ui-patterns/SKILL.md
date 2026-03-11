---
name: Angular UI Patterns
description: Use when designing or improving Angular UI architecture including reusable components, layout systems, UI composition patterns, design systems, and scalable component structures.
---

# Skill: Angular UI Patterns

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se creen o modifiquen componentes de interfaz
- Se pidan formularios con buena UX
- Se pida dark mode, temas o design tokens
- Se pida skeleton loading, spinners o loading states
- Se pida mejorar accesibilidad (a11y)
- Se mencione Angular Material, Tailwind, PrimeNG, animaciones
- El usuario diga "mejorar UI", "accesible", "responsive", "toast", "notificación"

---

## Stack de UI recomendado

| Caso                            | Stack                       |
| ------------------------------- | --------------------------- |
| Proyectos corporativos          | Angular Material + Tailwind |
| Apps con muchos datos           | PrimeNG                     |
| Diseño totalmente personalizado | Tailwind CSS solo           |
| Apps modernas con headless      | ng-primitives + Tailwind    |

---

## 1. Design Tokens con CSS Custom Properties

```scss
// styles/tokens.scss — fuente única de verdad para el design system
:root {
  // Colores de marca
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-danger-500: #ef4444;
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;

  // Semánticos (referencian los anteriores)
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;

  // Espaciado
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  // Tipografía
  --font-family: "Inter", system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  // Bordes y sombras
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

// Dark mode automático
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
}
```

---

## 2. Dark Mode con ThemeService

```typescript
// core/services/theme.service.ts
@Injectable({ providedIn: "root" })
export class ThemeService {
  private _isDark = signal(localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches));

  isDark = this._isDark.asReadonly();

  constructor() {
    // Aplicar tema inicial
    this.applyTheme(this._isDark());
  }

  toggle(): void {
    this._isDark.update((v) => !v);
    this.applyTheme(this._isDark());
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }
}

// Uso en componente
@Component({
  template: `
    <button (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Modo claro' : 'Modo oscuro'">
      {{ theme.isDark() ? "☀️" : "🌙" }}
    </button>
  `,
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
```

---

## 3. Skeleton Loading (mejor UX que spinners)

```typescript
// shared/components/skeleton/skeleton.component.ts
@Component({
  standalone: true,
  selector: "app-skeleton",
  template: `<div class="skeleton" [style]="styles()"></div>`,
  styles: [
    `
      .skeleton {
        background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  width = input("100%");
  height = input("1rem");
  rounded = input(false);

  styles = computed(() => ({
    width: this.width(),
    height: this.height(),
    borderRadius: this.rounded() ? "9999px" : "0.5rem",
  }));
}

// Patrón de uso con @defer
@Component({
  template: `
    @defer (when !facade.loading()) {
      @for (user of facade.users(); track user.id) {
        <app-user-card [user]="user" />
      } @empty {
        <p class="empty-state">No se encontraron usuarios</p>
      }
    } @placeholder {
      @for (i of placeholders; track i) {
        <app-user-card-skeleton />
      }
    }
  `,
})
export class UsersListComponent {
  facade = inject(UserFacade);
  placeholders = Array(6).fill(0); // 6 skeletons mientras carga
}

// Skeleton específico para UserCard
@Component({
  standalone: true,
  selector: "app-user-card-skeleton",
  imports: [SkeletonComponent],
  template: `
    <div class="card">
      <app-skeleton height="3rem" width="3rem" [rounded]="true" />
      <div class="card-info">
        <app-skeleton height="1rem" width="60%" />
        <app-skeleton height="0.75rem" width="40%" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardSkeletonComponent {}
```

---

## 4. Formularios con UX Correcta

```typescript
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <!-- Campo con estado visual y mensaje de error accesible -->
      <div class="field" [ngClass]="fieldClass('email')">
        <label for="email"> Email <span aria-hidden="true" class="required">*</span> </label>

        <input id="email" type="email" formControlName="email" autocomplete="email" [attr.aria-describedby]="hasError('email') ? 'email-error' : null" [attr.aria-invalid]="hasError('email')" />

        @if (hasError("email")) {
          <span id="email-error" class="field-error" role="alert">
            @if (emailCtrl.errors?.["required"]) {
              El email es obligatorio.
            }
            @if (emailCtrl.errors?.["email"]) {
              Ingresa un email válido.
            }
          </span>
        }
      </div>

      <!-- Botón con estado de carga -->
      <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()" [attr.aria-busy]="submitting()">
        @if (submitting()) {
          <span class="spinner" aria-hidden="true"></span>
          Guardando...
        } @else {
          Guardar
        }
      </button>
    </form>
  `,
})
export class UserFormComponent {
  submitting = signal(false);

  form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  get emailCtrl() {
    return this.form.controls.email;
  }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  fieldClass(field: string): Record<string, boolean> {
    const ctrl = this.form.get(field)!;
    return {
      "field--error": ctrl.invalid && ctrl.touched,
      "field--valid": ctrl.valid && ctrl.touched,
    };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // lógica de submit
  }
}
```

---

## 5. Toast / Notificaciones

```typescript
// shared/services/toast.service.ts
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();

  show(message: string, type: Toast["type"] = "info", duration = 4000): void {
    const id = crypto.randomUUID();
    this._toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  success(msg: string) {
    this.show(msg, "success");
  }
  error(msg: string) {
    this.show(msg, "error");
  }
  warning(msg: string) {
    this.show(msg, "warning");
  }
  info(msg: string) {
    this.show(msg, "info");
  }
}

// shared/components/toast-container/toast-container.component.ts
@Component({
  standalone: true,
  selector: "app-toast-container",
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="status">
          <span>{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">✕</button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
// Agregar <app-toast-container /> en app.component.html
```

---

## 6. Accesibilidad (a11y)

```typescript
// Instalar CDK
// npm install @angular/cdk

// Focus trap en modales — SIEMPRE usar en diálogos
import { A11yModule, LiveAnnouncer } from "@angular/cdk/a11y";

@Component({
  imports: [A11yModule],
  template: `
    <div cdkTrapFocus cdkTrapFocusAutoCapture role="dialog" aria-modal="true" [attr.aria-labelledby]="'dialog-title-' + id">
      <h2 [id]="'dialog-title-' + id">{{ title }}</h2>
      <ng-content />
      <button (click)="close.emit()">Cerrar</button>
    </div>
  `,
})
export class DialogComponent {
  id = input.required<string>();
  title = input.required<string>();
  close = output<void>();
}

// Anunciar cambios a lectores de pantalla
@Injectable({ providedIn: "root" })
export class AccessibilityService {
  private announcer = inject(LiveAnnouncer);

  announce(message: string, politeness: "polite" | "assertive" = "polite"): void {
    this.announcer.announce(message, politeness);
  }
}
```

```scss
// Estilos base de accesibilidad — incluir en styles.scss
// Focus visible siempre
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

// Skip link para navegación por teclado
.skip-link {
  position: absolute;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-500);
  color: white;
  transform: translateY(-100%);
  transition: transform 0.2s;
  z-index: 9999;

  &:focus {
    transform: translateY(0);
  }
}
```

```html
<!-- app.component.html — agregar siempre -->
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>
<main id="main-content">
  <router-outlet />
</main>
<app-toast-container />
```

---

## 7. Animaciones

```typescript
// shared/animations/index.ts
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 }))
  ])
]);

export const slideIn = trigger('slideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-16px)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const listStagger = trigger('listStagger', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      stagger('60ms', animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
]);

// Uso
@Component({
  animations: [fadeIn, listStagger],
  template: `
    <div [@fadeIn]>Aparece con fade</div>

    <ul [@listStagger]="users().length">
      @for (user of users(); track user.id) {
        <li>{{ user.name }}</li>
      }
    </ul>
  `
})
```

---

## 8. Imágenes Optimizadas

```typescript
// ✅ Siempre usar NgOptimizedImage (Angular 15+)
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: `
    <!-- LCP: agregar priority -->
    <img ngSrc="/assets/hero.webp" width="1200" height="600" priority
         alt="Banner principal" />

    <!-- Otras imágenes: lazy por defecto -->
    <img ngSrc="{{ user.avatarUrl }}" width="48" height="48"
         [alt]="'Avatar de ' + user.name" />

    <!-- Imágenes responsivas -->
    <img ngSrc="/assets/product.webp"
         sizes="(max-width: 768px) 100vw, 50vw"
         width="800" height="600"
         alt="Foto del producto" />
  `
})
```

---

## Checklist de UI antes de entregar

- [ ] Todos los inputs tienen `<label>` asociado con `for` / `id`
- [ ] Los errores de formulario usan `role="alert"` y `aria-describedby`
- [ ] Botones con acciones claras tienen `aria-label` si no tienen texto visible
- [ ] Hay skip link en `app.component.html`
- [ ] Focus visible en todos los elementos interactivos
- [ ] Contraste de colores mínimo 4.5:1 (texto normal) o 3:1 (texto grande)
- [ ] Imágenes con `alt` descriptivo (vacío `alt=""` solo para decorativas)
- [ ] Loading states (skeleton o spinner) para todas las peticiones async
- [ ] Botón de submit deshabilitado mientras `submitting()` es true
- [ ] `aria-live` en zonas que actualicen contenido dinámicamente
