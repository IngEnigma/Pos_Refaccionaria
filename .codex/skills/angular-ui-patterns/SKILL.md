---
name: Angular UI Patterns
description: Use when designing or improving Angular UI architecture including reusable components, layout systems, UI composition patterns, design systems, scalable component structures, accessibility, and dark mode. Compatible with Angular 17+.
---

# Skill: Angular UI Patterns
> Angular 17+ | Siempre combinar con angular-best-practices

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
  --color-primary-50:  #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-danger-500:  #ef4444;
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;

  // Semánticos (referencian los anteriores)
  --color-bg:         #ffffff;
  --color-surface:    #f9fafb;
  --color-border:     #e5e7eb;
  --color-text:       #111827;
  --color-text-muted: #6b7280;

  // Espaciado
  --space-1: 0.25rem;  --space-2: 0.5rem;
  --space-3: 0.75rem;  --space-4: 1rem;
  --space-6: 1.5rem;   --space-8: 2rem;

  // Tipografía
  --font-family:        "Inter", system-ui, sans-serif;
  --font-size-xs:       0.75rem;   --font-size-sm:   0.875rem;
  --font-size-base:     1rem;      --font-size-lg:   1.125rem;
  --font-size-xl:       1.25rem;   --font-size-2xl:  1.5rem;
  --font-weight-normal: 400;       --font-weight-semibold: 600;
  --font-weight-bold:   700;

  // Bordes y sombras
  --radius-sm:   0.25rem;   --radius-md:  0.5rem;
  --radius-lg:   0.75rem;   --radius-full: 9999px;
  --shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1);
}

// Dark mode automático
[data-theme="dark"] {
  --color-bg:         #0f172a;
  --color-surface:    #1e293b;
  --color-border:     #334155;
  --color-text:       #f1f5f9;
  --color-text-muted: #94a3b8;
}
```

---

## 2. Dark Mode con ThemeService (SSR-safe)

```typescript
// core/services/theme.service.ts
// ✅ SSR-safe: usa PLATFORM_ID para evitar acceder a window/localStorage en servidor
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private _isDark = signal<boolean>(this.loadInitialTheme());

  isDark = this._isDark.asReadonly();

  constructor() {
    // Sincronizar DOM y storage en cada cambio (solo en browser)
    effect(() => {
      if (!this.isBrowser) return;
      const dark = this._isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void { this._isDark.update(v => !v); }

  private loadInitialTheme(): boolean {
    if (!this.isBrowser) return false; // SSR: default a light
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }
}

// Uso en componente
@Component({
  template: `
    <button
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      [attr.aria-pressed]="theme.isDark()"
    >
      {{ theme.isDark() ? '☀️' : '🌙' }}
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
  selector: 'app-skeleton',
  template: `<div class="skeleton" [style]="styles()"></div>`,
  styles: [`
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-surface) 25%,
        var(--color-border) 50%,
        var(--color-surface) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton { animation: none; opacity: 0.6; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  width   = input('100%');
  height  = input('1rem');
  rounded = input(false);

  styles = computed(() => ({
    width:        this.width(),
    height:       this.height(),
    borderRadius: this.rounded() ? '9999px' : '0.5rem',
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
  facade       = inject(UserFacade);
  placeholders = Array(6).fill(0); // 6 skeletons mientras carga
}
```

---

## 4. Dialog con CDK (accesible y robusto)

```typescript
// Usar @angular/cdk/dialog — más robusto que implementación custom
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

// Componente del diálogo
@Component({
  standalone: true,
  imports:    [A11yModule],
  template: `
    <div
      cdkTrapFocus
      cdkTrapFocusAutoCapture
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      class="dialog-panel"
    >
      <h2 [id]="titleId">{{ data.title }}</h2>
      <p>{{ data.message }}</p>

      <div class="dialog-actions">
        <button (click)="cancel()" class="btn-secondary">Cancelar</button>
        <button (click)="confirm()" class="btn-primary" cdkFocusInitial>Confirmar</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  private dialogRef = inject<DialogRef<boolean>>(DialogRef);
  data     = inject<{ title: string; message: string }>(DIALOG_DATA);
  titleId  = `dialog-${crypto.randomUUID()}`;

  confirm(): void { this.dialogRef.close(true); }
  cancel():  void { this.dialogRef.close(false); }
}

// Servicio para abrir diálogos tipados
@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(Dialog);

  confirm(title: string, message: string): Observable<boolean> {
    const ref = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data:       { title, message },
      panelClass: 'dialog-backdrop',
    });
    return ref.closed.pipe(map(result => result ?? false));
  }
}

// Uso
export class ProductsComponent {
  private dialogService = inject(DialogService);

  deleteProduct(id: string): void {
    this.dialogService.confirm('Eliminar producto', '¿Estás seguro?')
      .pipe(filter(Boolean))
      .subscribe(() => this.facade.delete(id));
  }
}
```

---

## 5. Formularios con UX Correcta

```typescript
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field" [ngClass]="fieldClass('email')">
        <label for="email">
          Email <span aria-hidden="true" class="required">*</span>
        </label>

        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="email"
          [attr.aria-describedby]="hasError('email') ? 'email-error' : null"
          [attr.aria-invalid]="hasError('email')"
        />

        @if (hasError('email')) {
          <span id="email-error" class="field-error" role="alert">
            @if (emailCtrl.errors?.['required']) { El email es obligatorio. }
            @if (emailCtrl.errors?.['email'])    { Ingresa un email válido. }
          </span>
        }
      </div>

      <button
        type="submit"
        class="btn-primary"
        [disabled]="form.invalid || submitting()"
        [attr.aria-busy]="submitting()"
      >
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
    email: new FormControl('', {
      nonNullable: true,
      validators:  [Validators.required, Validators.email],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators:  [Validators.required, Validators.minLength(2)],
    }),
  });

  get emailCtrl() { return this.form.controls.email; }

  hasError(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  fieldClass(field: string): Record<string, boolean> {
    const ctrl = this.form.get(field)!;
    return {
      'field--error': ctrl.invalid && ctrl.touched,
      'field--valid': ctrl.valid  && ctrl.touched,
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

## 6. Toast / Notificaciones

```typescript
// shared/services/toast.service.ts
export interface Toast {
  id:      string;
  message: string;
  type:    'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = crypto.randomUUID();
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error');   }
  warning(msg: string) { this.show(msg, 'warning'); }
  info(msg: string)    { this.show(msg, 'info');    }
}

// shared/components/toast-container/toast-container.component.ts
@Component({
  standalone: true,
  selector:   'app-toast-container',
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notificaciones" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="status">
          <span>{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)" aria-label="Cerrar notificación">✕</button>
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

## 7. Container Queries — Responsive por componente

```scss
// ✅ Container queries: más potente que media queries para componentes
// El componente responde a su PROPIO tamaño, no al viewport
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display:               grid;
    grid-template-columns: auto 1fr;
    gap:                   var(--space-4);
  }
  .card__avatar { width: 4rem; height: 4rem; }
  .card__body   { display: flex; flex-direction: column; }
}

@container card (max-width: 399px) {
  .card {
    display:        flex;
    flex-direction: column;
    text-align:     center;
  }
  .card__avatar { width: 3rem; height: 3rem; margin: 0 auto; }
}

// Ventaja sobre media queries: el mismo componente puede verse
// diferente en un sidebar (estrecho) vs contenido principal (ancho)
// sin necesidad de configuración externa
```

---

## 8. HostAttributeToken — Atributos HTML nativos en componentes

```typescript
// ✅ HostAttributeToken (Angular 17+): leer atributos HTML del host
// Útil para componentes que envuelven elementos nativos (button, input, etc.)
import { HostAttributeToken } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) { <span class="spinner" aria-hidden="true"></span> }
      <ng-content />
    </button>
  `,
  host: {
    '[class.btn--loading]': 'loading()',
  },
})
export class ButtonComponent {
  // Lee el atributo 'type' del elemento host: <app-button type="submit">
  // Si no se pasa, usa 'button' como default
  type = inject(new HostAttributeToken('type'), { optional: true }) ?? 'button';

  loading  = input(false);
  disabled = input(false);
}

// Uso
// <app-button type="submit" [loading]="submitting()">Guardar</app-button>
// <app-button type="button" (click)="cancel()">Cancelar</app-button>
```

---

## 9. Accesibilidad (a11y)

```typescript
// npm install @angular/cdk
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

// Anunciar cambios a lectores de pantalla
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private announcer = inject(LiveAnnouncer);

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.announce(message, politeness);
  }
}
```

```scss
// styles.scss — estilos base de accesibilidad SIEMPRE incluir

// Focus visible en todos los elementos interactivos
*:focus-visible {
  outline:        2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius:  var(--radius-sm);
}

// Skip link para navegación por teclado
.skip-link {
  position:   absolute;
  padding:    var(--space-2) var(--space-4);
  background: var(--color-primary-500);
  color:      white;
  transform:  translateY(-100%);
  transition: transform 0.2s;
  z-index:    9999;

  &:focus { transform: translateY(0); }
}

// Respetar preferencias de movimiento reducido
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:   0.01ms !important;
    transition-duration:  0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

```html
<!-- app.component.html — estructura base siempre -->
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>
<main id="main-content">
  <router-outlet />
</main>
<app-toast-container />
```

---

## 10. Animaciones

```typescript
// ✅ IMPORTANTE: registrar provideAnimationsAsync() en app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(), // ✅ lazy — no bloquea bootstrap
    // provideAnimations()    // ❌ sincrónico — evitar
  ]
};

// shared/animations/index.ts
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      stagger('60ms', animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))),
    ], { optional: true }),
  ]),
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
  `,
})
```

---

## 11. Imágenes Optimizadas

```typescript
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: `
    <!-- LCP: agregar priority en la imagen más grande del viewport inicial -->
    <img ngSrc="/assets/hero.webp" width="1200" height="600" priority
         alt="Banner principal" />

    <!-- Lazy por defecto -->
    <img ngSrc="{{ user.avatarUrl }}" width="48" height="48"
         [alt]="'Avatar de ' + user.name" />

    <!-- Responsiva con sizes -->
    <img ngSrc="/assets/product.webp"
         sizes="(max-width: 768px) 100vw, 50vw"
         width="800" height="600"
         alt="Foto del producto" />
  `
})
```

---

## Checklist de UI antes de entregar

### Accesibilidad (WCAG 2.1 AA)
- [ ] Todos los inputs tienen `<label>` asociado (`for` / `id`)
- [ ] Errores de formulario usan `role="alert"` y `aria-describedby`
- [ ] Botones sin texto visible tienen `aria-label`
- [ ] Skip link presente en `app.component.html`
- [ ] Focus visible en todos los elementos interactivos (`*:focus-visible`)
- [ ] Contraste mínimo 4.5:1 (texto normal) o 3:1 (texto grande/iconos)
- [ ] Imágenes tienen `alt` descriptivo (`alt=""` solo para decorativas)
- [ ] `aria-live` en zonas con contenido dinámico (toasts, resultados de búsqueda)
- [ ] Modales usan `cdkTrapFocus` y `aria-modal="true"`
- [ ] `prefers-reduced-motion` respetado en animaciones
- [ ] Auditar con axe DevTools o Lighthouse antes de entregar

### Performance
- [ ] Imágenes LCP tienen `priority`
- [ ] Imágenes usan `NgOptimizedImage`
- [ ] `provideAnimationsAsync()` en lugar de `provideAnimations()`
- [ ] Componentes pesados usan `@defer`

### UX
- [ ] Loading states para todas las peticiones async
- [ ] Botón submit deshabilitado mientras `submitting()` es true
- [ ] Skeleton loading en lugar de spinner cuando sea posible
- [ ] Dark mode funciona con `ThemeService` SSR-safe

---

## Errores comunes en code review

| Error | Por qué es problema | Solución |
|-------|---------------------|----------|
| `localStorage` en constructor directamente | Rompe SSR (no existe en servidor) | Usar `ThemeService` con `PLATFORM_ID` |
| `provideAnimations()` | Bloquea bootstrap síncrono | Cambiar a `provideAnimationsAsync()` |
| Dialog custom sin `cdkTrapFocus` | El foco escapa del modal (a11y) | Usar `@angular/cdk/dialog` o agregar `cdkTrapFocus` |
| Media queries en lugar de container queries | Componente depende del viewport, no de su tamaño | Migrar a `container-type` para componentes reutilizables |
| `@Input()` en vez de `HostAttributeToken` para atributos HTML | No lee atributos estáticos del host correctamente | Usar `HostAttributeToken` para type, role, etc. |
| Sin `prefers-reduced-motion` | Animaciones pueden causar mareos | Agregar media query en estilos globales |
