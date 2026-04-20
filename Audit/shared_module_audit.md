# 🔍 Auditoría Profunda — Módulo `/shared/ui`

Auditoría realizada con base en los skills: **angular-best-practices**, **angular-clean-architecture**, **angular-ui-patterns** y **angular-testing**.

---

## 🔴 Problemas Críticos

### 1. `tokens.css` — Variables circulares e incompletas

**Archivo:** [tokens.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/tokens/tokens.css)

```css
:root {
  --color-primary-600: var(--color-primary-600); /* ← Circular */
  --color-danger: var(--color-danger);           /* ← Circular */
}
```

- **Problema:** Las variables CSS se referencian a sí mismas — esto es una **referencia circular** que en el mejor caso se resuelve por la cascada global de `styles.css`, y en el peor caso genera `undefined`.
- **Principio violado:** **SRP** — El archivo no cumple su responsabilidad como fuente única de verdad del Design System.
- **Por qué es crítico:** Si un consumidor importa solo `/shared` sin `styles.css`, todas las variables colapsan. El archivo es **inútil** en su estado actual.
- **Solución:** Convertir `tokens.css` en el **archivo canónico** con todos los tokens reales, o eliminarlo y referenciar `styles.css` directamente. Agregar tokens semánticos diferenciados de los de marca.

```css
/* tokens.css — fuente única de verdad */
:root {
  /* Marca */
  --color-primary-700: #1a2764;
  --color-primary-600: #233387;
  --color-primary-100: #e6f0ff;
  --color-primary-50:  #ebf3ff;
  /* Semánticos */
  --color-danger: #dc2626;
  --color-success: #059669;
  --color-warning: #f59e0b;
  /* Superficies */
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-border: #d1d4db;
  --color-text: #374151;
  --color-text-strong: #111827;
  --color-text-muted: #6b7280;
  /* Espaciado, radios, sombras, tipografía... */
}
```

---

### 2. `dropdown-menu.component` — CSS hardcodeado `background: white`, sin `ChangeDetectionStrategy`

**Archivo:** [dropdown-menu.component.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown-menu.component.ts)

```typescript
// Línea 24: background hardcodeado
styles: [`
  .dropdown-menu { background: white; ... }
`]
```

- **Problema:** `background: white` está hardcodeado — rompe dark mode e ignora tokens del Design System. Además, **falta `changeDetection: ChangeDetectionStrategy.OnPush`**.
- **Principio violado:** **OCP** (Open/Closed) — El componente no es extensible a temas; **Best Practices** — skill exige `OnPush` en todos los componentes.
- **Solución:**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dropdown-menu { background: var(--color-surface); }
  `]
})
```

---

### 3. `dropdown-item.component.ts` — Dos componentes en un solo archivo

**Archivo:** [dropdown-item.component.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown-item.component.ts#L67-L80)

- **Problema:** `DropdownItemComponent` y `DropdownDividerComponent` están en el **mismo archivo** (línea 67). Viola la convención de un componente por archivo y dificulta tree-shaking y mantenibilidad.
- **Principio violado:** **SRP** — Un archivo = una responsabilidad.
- **Solución:** Extraer `DropdownDividerComponent` a su propio archivo `dropdown-divider.component.ts` y exportarlo en `index.ts`.

---

### 4. `dropdown.component` — Template HTML obsoleto y duplicado con lógica del `.ts`

**Archivo:** [dropdown.component.html](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown.component.html)

```html
<div #trigger (click)="toggle()" role="button" ...>
  <ng-content select="[dropdownTrigger]"></ng-content>
</div>
<ng-template #menu>
  <div class="dropdown-menu">
    <ng-content select="[dropdownMenu]"></ng-content>
  </div>
</ng-template>
```

- **Problema:** El template tiene un `<div>` trigger que hace `(click)="toggle()"` **y** existe `DropdownTriggerDirective` que **también** hace `onClick() → toggle()`. Esto causa **doble toggle** cuando se usa la directiva sobre un elemento dentro del `[dropdownTrigger]` slot. Además, el `<ng-template #menu>` **nunca se usa** — el `DropdownMenuComponent` maneja su propia proyección vía `TemplatePortal`.
- **Principio violado:** **SRP** — Lógica de toggle duplicada entre template y directiva; **DRY** — Código muerto.
- **Solución:** El `dropdown.component` debería usar `template: '<ng-content></ng-content>'` (como ya hace el inline template en `.ts` línea 18). El HTML file `dropdown.component.html` y su CSS **son código muerto** porque el componente usa `template` inline, no `templateUrl`.

> [!CAUTION]
> El `.ts` usa `template` inline pero `dropdown.component.html` existe. Confirmar cuál se usa realmente. Si Angular respeta la propiedad `template:` del decorador, el HTML y CSS files están **completamente ignorados** → código muerto.

---

### 5. `base-control-value-accessor` — Desincronización entre `.ts` y `.spec.ts`

**Archivo:** [base-control-value-accessor.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/form-controls/base/base-control-value-accessor.ts) vs [spec](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/form-controls/base/base-control-value-accessor.spec.ts)

- **Problema:** El test (línea 11) invoca `super('initial')` pero el constructor del base class **no acepta parámetros**. El base usa `private _value: T | undefined` que empieza como `undefined`. Esto significa que el test **fallará en compilación o en runtime** ya que el constructor de `BaseControlValueAccessor` no toma argumentos.
- **Principio violado:** Testing skill — Tests deben compilar y ser correctos.
- **Solución:** O bien agregar un constructor con `initialValue` al base:

```typescript
constructor(initialValue?: T) {
  this._value = initialValue;
}
```

O corregir el test para no pasar argumentos.

---

## 🟠 Problemas Importantes

### 6. `dropdown.component` — CSS file (`dropdown.component.css`) sin consumo

**Archivos:** [dropdown.component.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown.component.css) + [dropdown-menu.component.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown-menu.component.ts)

- **Problema:** `dropdown.component.ts` usa template inline (`template:`) sin `styleUrl`. El archivo CSS de 79 líneas con estilos de `.dropdown-menu`, `.dropdown-divider`, botones, etc., **no se carga**. Pero `dropdown-menu.component.ts` tiene **sus propios estilos inline duplicando parcialmente** los del CSS file.
- **Principio violado:** **DRY** — Estilos duplicados y muertos; **Consistencia** — Dos fuentes de estilos para el mismo componente visual.
- **Solución:** Centralizar los estilos en un solo lugar (preferiblemente en el `dropdown-menu.component` que es el que se renderiza). Eliminar `dropdown.component.css` y `dropdown.component.html`.

---

### 7. `button.component` — `onClick` output intercepta eventos nativos

**Archivo:** [button.component.html](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/button/button.component.html#L14)

```html
<button (click)="onClick.emit($event)">
```

- **Problema:** El `<button>` nativo ya emite `click` events que burbujean al host. El `onClick` output crea una **doble emisión**: el consumer recibe tanto el event nativo como el output. Además, el nombre `onClick` no sigue la convención Angular (`clicked` o simplemente dejar el click nativo burbujear).
- **Principio violado:** **ISP** — El output es innecesario; **Best Practices** — Naming.
- **Solución:** Eliminar el output `onClick` y dejar que el evento nativo `click` burbujee. Los consumidores usan `(click)="handler()"` directamente en `<app-button>`.

---

### 8. `icon-button.component` vs `button.component` — Inconsistencia de API

**Archivos:** [icon-button](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/icon-button/icon-button.component.ts) vs [button](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/button/button.component.ts)

| Aspecto | `ButtonComponent` | `IconButtonComponent` |
|---|---|---|
| Output | `onClick: output<MouseEvent>()` | `clicked: output<void>()` |
| Disabled check | Via `[disabled]` en HTML | Manual en `onClick()` |
| Variants | `primary/secondary/danger/ghost/outline` | Solo hover/active visual |
| Loading | ✅ Soportado | ❌ No soportado |
| Size values | Usa clases CSS | Usa clases CSS (consistente) |

- **Problema:** Dos componentes del mismo Design System con APIs completamente diferentes. `IconButton` no soporta `variant`, no tiene `loading`, y el manejo de `disabled` es manual en vez de usar `[disabled]` del HTML nativo.
- **Principio violado:** **LSP** — Un botón icono debería ser sustituible en contextos donde se espera un botón. **Consistencia de Design System**.
- **Solución:** `IconButtonComponent` debería compartir las mismas variantes y patrones que `ButtonComponent`, o ser un modo de `ButtonComponent` (ej: `<app-button variant="ghost" iconOnly>`).

---

### 9. `icon-button` — Tamaño de icono hardcodeado

**Archivo:** [icon-button.component.html](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/icon-button/icon-button.component.html#L10)

```html
<lucide-icon [name]="icon()" [size]="22" ...>
```

- **Problema:** El `[size]` del icono es `22` fijo, aunque el componente soporta tamaños `sm | md | lg`. Un botón `sm` de `1.8rem` con un icono de `22px` se ve desproporcionado.
- **Principio violado:** **Consistencia visual** — El tamaño del icono debería ser proporcional al tamaño del botón.
- **Solución:** Crear un computed `iconSize` que mapee `sm→16`, `md→20`, `lg→24`.

---

### 10. `search-input` — No es un `ControlValueAccessor`

**Archivo:** [search-input.component.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/form-controls/search-input/search-input.component.ts)

- **Problema:** Está en `form-controls/` pero **no implementa** `ControlValueAccessor`. No se puede usar con `formControlName` ni `[(ngModel)]`. Usa `output<string>` en vez de integrarse con el sistema de formularios Angular.
- **Principio violado:** **LSP** — Un form control en `form-controls/` debería ser usable como form control. **Arquitectura** — Inconsistencia de ubicación.
- **Solución:** Implementar `ControlValueAccessor` extendiendo `BaseControlValueAccessor<string>`, o moverlo a `components/` si no va a ser un form control.

---

### 11. `DropdownDividerComponent` no se exporta en `index.ts`

**Archivos:** [index.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/index.ts) + [dropdown-item.component.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/dropdown/dropdown-item.component.ts#L67)

- **Problema:** `DropdownDividerComponent` existe pero **no se exporta** en `index.ts`. Los consumidores tienen que importarlo con path directo, rompiendo la encapsulación del barrel file.
- **Principio violado:** **Encapsulación del módulo** — El barrel file debe ser la API pública completa.
- **Solución:** Agregar `export * from './components/dropdown/dropdown-divider.component'` tras extraer el componente a su propio archivo.

---

### 12. `toast.service` — `setTimeout` sin abstracción ni limpieza al destruir

**Archivo:** [toast.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/toast/toast.service.ts)

- **Problema:** Usa `setTimeout` directamente y `crypto.randomUUID()`. Ambos son dependencias globales del browser que dificultan testing y SSR. Además, `providedIn: 'root'` significa que los timers sobreviven a cualquier cambio de ruta — si la app navega en SPA, los timers de toasts viejos siguen corriendo.
- **Principio violado:** **DIP** — Dependencia directa de APIs globales del browser.
- **Solución:** Aunque los timers se limpian en `dismiss()`, sería más robusto inyectar `NgZone` para los timers o usar `DestroyRef` si fuera un servicio scoped. Para SSR, abstraer `crypto.randomUUID()` con un ID generator inyectable.

---

## 🟡 Mejoras Recomendadas

### 13. `input.component` — `margin-bottom` hardcodeado en CSS

**Archivo:** [input.component.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/form-controls/input/input.component.css#L4)

```css
.input-container { margin-bottom: var(--space-6); }
```

- **Problema:** Un componente reutilizable no debería definir su propio margen externo. Esto viola el principio de composición — el **padre** debe decidir el espaciado.
- **Solución:** Eliminar `margin-bottom` del componente. El consumidor controla el espaciado via su propio layout.

---

### 14. `search-input` — `:host` con layout constraints

**Archivo:** [search-input.component.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/form-controls/search-input/search-input.component.css#L1-L6)

```css
:host { flex: 1; max-width: 540px; }
```

- **Problema:** El `:host` define `flex: 1` y `max-width: 540px` — esto acopla el componente a un layout específico (flex row en navbar). Un componente de búsqueda reutilizable no debería decidir su `flex` ni `max-width`.
- **Solución:** Remover layout constraints de `:host`. El padre aplica estas restricciones.

---

### 15. `button.component.css` — `!important` en disabled state

**Archivo:** [button.component.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/button/button.component.css#L23)

```css
.button-base:disabled { transform: none !important; }
```

- **Problema:** `!important` es un code smell en CSS scoped. Indica un conflicto de especificidad que debería resolverse con mejor organización de selectores.
- **Solución:** Reordenar las reglas CSS para que `:disabled` tenga mayor especificidad naturalmente.

---

### 16. `toast-container.component` — Falta de límite máximo de toasts

**Problema:** No hay límite en la cantidad de toasts visibles simultáneamente. Un error en loop puede generar cientos de toasts.
- **Solución:** Agregar `private readonly MAX_TOASTS = 5` en el servicio y hacer `slice` al agregar.

---

### 17. Falta de `font-size-xs` token en `styles.css`

**Problema:** Varios componentes usan `var(--font-size-xs)` ([button.component.css](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/shared/ui/components/button/button.component.css#L28)) pero este token **no está definido** en `styles.css` (solo tiene `sm`, `base`, `lg`).
- **Solución:** Agregar `--font-size-xs: 0.75rem;` a `styles.css`.

---

### 18. Falta de `--shadow-md` y `--shadow-xl` en tokens

**Problema:** `toast-container` usa `var(--shadow-md, ...)` y `dropdown-menu` usa `var(--shadow-xl, ...)` con fallbacks, pero estos tokens no existen en `styles.css`. Solo `--shadow-sm` y `--shadow-panel` están definidos.
- **Solución:** Agregar tokens de sombra completos al Design System.

---

## 🟢 Buenas Prácticas Detectadas

| Práctica | Dónde | Por qué es buena |
|---|---|---|
| `ChangeDetectionStrategy.OnPush` | button, icon-button, skeleton, toast-container, input, search-input | Alineado al skill de best practices |
| `standalone: true` en todos | Todos los componentes | Elimina necesidad de NgModules |
| `input()` / `output()` signals | button, icon-button, skeleton, input, search-input, dropdown-item | API moderna Angular 17.1+ |
| `computed()` para estado derivado | skeleton, input | Reactivo y eficiente |
| `inject()` en vez de constructor DI | toast-container, dropdown, dropdown-trigger, dropdown-menu, dropdown-item, search-input | Patrón moderno recomendado |
| `takeUntilDestroyed()` | dropdown.component, search-input | Previene memory leaks |
| `timerMap` en `ToastService` | toast.service.ts | Limpia timers al dismiss manual — evita memory leaks |
| ARIA attributes | button (`aria-busy`, `aria-disabled`), input (`aria-invalid`, `aria-describedby`), toast-container (`aria-live`), dropdown (`aria-expanded`, `aria-haspopup`) | Buena base de accesibilidad |
| Password toggle con `aria-label` y `aria-pressed` | input.component | Accesibilidad correcta para toggle |
| `role="alert"` en error messages | input.component | Screen readers anuncian errores |
| Debounce + `distinctUntilChanged` | search-input | Performance y UX correcta |
| Content projection con slots (`leading`, `trailing`) | button.component | Extensible sin modificar el componente |
| Overlay CDK para posicionamiento | dropdown.component | Profesional, no reinventa positioning |

---

## 🎨 Evaluación del Design System

### Consistencia Visual

| Criterio | Estado | Detalle |
|---|---|---|
| Tokens centralizados | 🔴 **Malo** | `tokens.css` contiene variables circulares. Los tokens reales están en `styles.css` global, no en `/shared` |
| Colores consistentes | 🟡 Parcial | Usan `var()` en general, pero hay `background: white` hardcodeado en dropdown-menu |
| Tipografía | 🟡 Parcial | Mezcla de `--font-title-family` y `--font-text-family` sin documentación de cuándo usar cada una |
| Espaciado | 🟢 Bueno | Uso consistente de `--space-*` tokens |
| Radios | 🟢 Bueno | Uso consistente de `--radius-*` tokens |
| Sombras | 🟠 Incompleto | Tokens de sombra insuficientes (`--shadow-sm` y `--shadow-panel` solamente) |

### Reutilización Real

- **button** → ✅ Altamente reutilizable (variantes, sizes, loading, slots)
- **icon-button** → 🟡 Reutilizable pero API inconsistente con button
- **dropdown** → 🟡 Compound pattern bien intencionado, pero con código muerto y bugs potenciales (doble toggle)
- **skeleton** → ✅ Excelente — limpio, configurable, alineado al skill
- **toast** → ✅ Bien diseñado, con animaciones y mensajes por defecto
- **input** → ✅ Bien implementado con CVA, password toggle, error states
- **search-input** → 🟡 Funcional pero no es CVA a pesar de estar en `form-controls/`

### Escalabilidad

| Aspecto | Evaluación |
|---|---|
| Agregar nueva variante a button | ✅ Fácil — agregar clase CSS |
| Agregar dark mode | 🔴 Imposible — tokens en `styles.css` sin variante dark, y hardcodes |
| Agregar nuevo form control | 🟡 Factible — `BaseControlValueAccessor` existe pero tiene limitaciones |
| Internacionalización de labels | 🔴 Strings hardcodeados en español |
| Agregar nuevo componente | ✅ Fácil — estructura modular |

### Naming Conventions

| Componente | Selector | Alineado |
|---|---|---|
| ButtonComponent | `app-button` | ✅ |
| IconButtonComponent | `app-icon-button` | ✅ |
| DropdownComponent | `app-dropdown` | ✅ |
| DropdownTriggerDirective | `[appDropdownTrigger]` | ✅ |
| DropdownMenuComponent | `app-dropdown-menu` | ✅ |
| DropdownItemComponent | `app-dropdown-item` | ✅ |
| SkeletonComponent | `app-skeleton` | ✅ |
| ToastContainerComponent | `app-toast-container` | ✅ |
| InputComponent | `app-input` | ✅ |
| SearchInputComponent | `app-search-input` | ✅ |
| Output `onClick` vs `clicked` | — | ❌ Inconsistente |

---

## 🧪 Evaluación de Testing

### Cobertura por componente

| Componente | Tiene spec | Calidad |
|---|---|---|
| `ButtonComponent` | ❌ **NO** | — |
| `IconButtonComponent` | ❌ **NO** | — |
| `DropdownComponent` | ❌ **NO** | — (componente más complejo del módulo) |
| `DropdownTriggerDirective` | ❌ **NO** | — |
| `DropdownMenuComponent` | ❌ **NO** | — |
| `DropdownItemComponent` | ❌ **NO** | — |
| `SkeletonComponent` | ❌ **NO** | — |
| `ToastContainerComponent` | ❌ **NO** | — |
| `ToastService` | ✅ | 🟢 **Buenos tests** — default messages, custom messages, auto-dismiss, manual dismiss, timer cleanup |
| `BaseControlValueAccessor` | ✅ | 🟠 **Desync con implementación** — constructor signature mismatch |
| `InputComponent` | ✅ | 🟡 **Básico** — creación, value update, password toggle, error display. Falta: disabled state, CVA integration con `FormControl`, blur/touched |
| `SearchInputComponent` | ✅ | 🟢 **Buena** — debounce, distinctUntilChanged. Falta: disabled state, accessibility |

### Tests críticos faltantes

1. **`DropdownComponent`** — Toggle, escape key, backdrop click, overlay positioning, focus return
2. **`ButtonComponent`** — Cada variante renderiza clases correctas, disabled state, loading state, slot projection
3. **`ToastContainerComponent`** — Renderiza toasts del servicio, animation triggers, close button
4. **`InputComponent`** — Integración con `FormControl` (validaciones, disabled, reset), accesibilidad

---

## 🚀 Recomendaciones de Arquitectura UI

### 1. Compound Components — Dropdown

El dropdown ya tiene un buen inicio como Compound Component, pero necesita:

```html
<!-- Uso ideal -->
<app-dropdown>
  <app-dropdown-trigger>
    <app-icon-button icon="settings" ariaLabel="Configuración" />
  </app-dropdown-trigger>
  <app-dropdown-menu>
    <app-dropdown-item icon="user" (action)="goToProfile()">Perfil</app-dropdown-item>
    <app-dropdown-divider />
    <app-dropdown-item icon="log-out" variant="danger" (action)="logout()">Salir</app-dropdown-item>
  </app-dropdown-menu>
</app-dropdown>
```

**Correcciones necesarias:**
- Eliminar template HTML muerto y CSS muerto de `dropdown.component`
- Dar `ChangeDetectionStrategy.OnPush` a `dropdown-menu.component`
- Fixear `background: white` → `var(--color-surface)`
- Extraer `DropdownDividerComponent` a archivo propio
- Agregar keyboard navigation (arrow keys) entre items

### 2. Unificar Button + IconButton

```typescript
// Propuesta: ButtonComponent con modo iconOnly
<app-button variant="ghost" [iconOnly]="true" ariaLabel="Cerrar">
  <lucide-icon name="x" leading />
</app-button>
```

Esto elimina la necesidad de `IconButtonComponent` como componente separado.

### 3. ControlValueAccessor avanzado

Mejoras al `BaseControlValueAccessor`:

```typescript
export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
  // Usar signals en vez de propiedades privadas
  protected readonly internalValue = signal<T | undefined>(undefined);
  protected readonly internalDisabled = signal(false);

  // Exposición readonly
  readonly value = this.internalValue.asReadonly();
  readonly disabled = this.internalDisabled.asReadonly();

  constructor(initialValue?: T) {
    if (initialValue !== undefined) {
      this.internalValue.set(initialValue);
    }
  }
}
```

### 4. Design Tokens + Theming

```css
/* tokens.css — Nivel semántico */
:root {
  /* Colores primitivos */
  --color-blue-600: #233387;
  --color-red-500: #dc2626;

  /* Colores semánticos (referencian primitivos) */
  --color-primary: var(--color-blue-600);
  --color-danger: var(--color-red-500);

  /* Colores de superficie */
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
}
```

### 5. Accessibility-first Design

**Faltas críticas de accesibilidad:**
- `dropdown-item` no tiene `tabindex` ni keyboard navigation entre items (arrow keys)
- `dropdown-menu` no tiene `aria-labelledby` conectado al trigger
- `skeleton` no tiene `role="status"` ni `aria-label="Cargando"`
- `icon-button.active` no tiene `aria-pressed="true"`

---

## 🧩 Bonus — Mejoras Específicas por Componente

### `button.component`
- ✅ **Bien:** Variantes, sizes, loading state, content projection con slots
- ❌ **Eliminar:** Output `onClick` — dejar burbujear el click nativo
- ❌ **Fix:** `!important` en disabled
- 🔧 **Agregar:** Input `ariaLabel` para botones sin texto visible

### `dropdown (trigger, menu, item)`
- ❌ **Eliminar:** `dropdown.component.html` y `dropdown.component.css` (código muerto)
- ❌ **Fix:** `background: white` → `var(--color-surface)` en menu
- ❌ **Fix:** Agregar `ChangeDetectionStrategy.OnPush` a `dropdown-menu`
- 🔧 **Extraer:** `DropdownDividerComponent` a su propio archivo
- 🔧 **Agregar:** Keyboard navigation (ArrowDown/ArrowUp entre items)
- 🔧 **Agregar:** `aria-labelledby` en menu referenciando el trigger

### `toast.service` y `toast-container`
- ✅ **Bien:** Signals, timer cleanup, default messages, animaciones, iconos diferenciados
- 🔧 **Agregar:** Límite máximo de toasts simultáneos
- 🔧 **Agregar:** Test para `ToastContainerComponent`
- 🟡 **Considerar:** Hacer configurable la posición del container

### `base-control-value-accessor`
- ✅ **Bien:** Genérico con `<T>`, clean API con `updateValue()` y `markAsTouched()`
- ❌ **Fix:** Agregar constructor con `initialValue` para alinear con tests
- 🔧 **Mejorar:** Migrar a signals internamente
- 🔧 **Agregar:** Método `reset()` y hook `onValueChange()`

### `input` y `search-input`
- ✅ **input:** Buen CVA con password toggle, error states, ARIA
- ❌ **input fix:** Eliminar `margin-bottom` del componente
- ❌ **search-input fix:** Eliminar layout constraints de `:host`
- 🔧 **search-input:** Implementar CVA o mover a `components/`
- 🔧 **input:** Agregar soporte para `prefix`/`suffix` icons genéricos

### `skeleton.component`
- ✅ **Excelente:** Limpio, configurable, alineado al skill de UI patterns
- 🔧 **Agregar:** `role="status"` y `aria-label="Cargando"` para accesibilidad
- 🔧 **Considerar:** Variantes predefinidas `variant = 'text' | 'avatar' | 'card'`

### `tokens.css`
- ❌ **Reescribir completamente** — Es inútil en su estado actual
- 🔧 Debe ser la **fuente canónica** de todos los design tokens
- 🔧 Agregar niveles: primitivos → semánticos → componente
- 🔧 Agregar variante dark mode
- 🔧 Importar desde `styles.css` o `angular.json` en vez de duplicar

---

## 🔥 Evaluación Final — ¿`/shared` cumple como Design System?

### ¿UI Kit reutilizable?
🟡 **Parcialmente.** Los componentes individuales son funcionales y reutilizables, pero la inconsistencia entre APIs (button vs icon-button), código muerto (dropdown HTML/CSS), y falta de tokens hacen que no se sienta como un kit cohesivo.

### ¿Design System?
🔴 **No.** Un Design System requiere:
1. **Tokens propios y centralizados** → `tokens.css` es circular y vacío
2. **Documentación de uso** → No existe
3. **Consistencia visual completa** → Hay hardcodes y tokens faltantes
4. **Theming** → No hay soporte para dark mode
5. **Testing completo** → Solo 4 de 10+ componentes tienen tests

### ¿Librería independiente?
🔴 **No.** Depende de `styles.css` global para que los tokens funcionen. No puede funcionar sin el proyecto host.

### ¿Qué lo limita?

1. **Tokens definidos en `styles.css` global** en vez de en `/shared` — Acoplamiento fuerte al proyecto
2. **Código muerto en dropdown** — Señal de iteraciones sin cleanup
3. **Strings hardcodeados en español** — No internacionalizable
4. **Falta de tests en componentes core** — No se puede refactorizar con confianza
5. **API inconsistente** — Button y IconButton son hermanos que no se parecen

### ¿Qué decisiones lo frenan?

1. Mantener `tokens.css` como proxy circular de `styles.css` en vez de fuente canónica
2. No unificar button e icon-button bajo una API común
3. Poner `search-input` en `form-controls/` sin implementar CVA
4. No eliminar código muerto del dropdown durante refactors previos
