---
name: Angular State Management
description: Use when implementing or reviewing state management in Angular applications, including signals, resource(), linkedSignal, services, RxJS patterns, global state, component state, and best practices for reactive data flow. Compatible with Angular 17+, resource() requires Angular 19+.
---

# Skill: Angular State Management
> Angular 17+ | resource() requiere Angular 19+

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se maneje estado compartido entre componentes
- Se pida compartir datos entre rutas o módulos
- Se usen BehaviorSubject que puedan convertirse en signals
- El usuario mencione "store", "estado global", "NgRx", "signals", "reactivo"
- Haya props drilling excesivo entre componentes
- Se hagan peticiones HTTP y se quiera manejar loading/error automáticamente

---

## Árbol de decisión — ¿Qué solución usar?

```
¿El estado es local a un solo componente?
  └─ SÍ → signal() local en el componente

¿El estado viene principalmente de HTTP y es lectura?
  └─ SÍ → resource() / httpResource() (Angular 19+)

¿El estado es local a una feature (lectura + escritura)?
  └─ SÍ → Service con signals (providedIn feature route)

¿El estado es global y la lógica es simple?
  └─ SÍ → Service con signals (providedIn: 'root')

¿El estado es global con lógica compleja o efectos async?
  └─ SÍ → NgRx Signal Store

¿Proyecto enterprise con equipo grande y devtools críticos?
  └─ SÍ → NgRx clásico (Redux)
```

---

## Opción 0: resource() y httpResource() — Angular 19+ (preferido para HTTP)

```typescript
import { resource, httpResource } from '@angular/core';

// httpResource — para peticiones GET simples (más conciso)
export class ProductsPageComponent {
  // Reactivo: se re-ejecuta cuando cambia el signal de filtros
  filters = signal({ category: 'all', page: 1 });

  productsResource = httpResource<Product[]>(
    () => `/api/products?category=${this.filters().category}&page=${this.filters().page}`
  );

  // El resource expone signals automáticamente:
  // productsResource.value()   → Product[] | undefined
  // productsResource.isLoading() → boolean
  // productsResource.error()   → unknown
  // productsResource.status()  → ResourceStatus (Idle/Loading/Resolved/Error)
}

// resource() — para lógica async personalizada (no solo HTTP)
export class UserDetailComponent {
  userId = input.required<string>();

  userResource = resource({
    request: () => ({ id: this.userId() }), // señal de parámetros reactivos
    loader: async ({ request, abortSignal }) => {
      const res = await fetch(`/api/users/${request.id}`, { signal: abortSignal });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<User>;
    },
  });

  // Recargar manualmente
  refresh(): void { this.userResource.reload(); }

  // Mutación optimista local (sin invalidar el resource)
  updateNameLocally(name: string): void {
    this.userResource.update(prev => prev ? { ...prev, name } : prev);
  }
}

// En template
// @if (userResource.isLoading()) { <app-skeleton /> }
// @if (userResource.error()) { <app-error [error]="userResource.error()" /> }
// @if (userResource.value(); as user) { <app-user-card [user]="user" /> }
```

---

## Opción 1: Service con Signals (default para estado con escritura)

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  // Estado privado — nunca exponer directamente
  private _items   = signal<CartItem[]>([]);
  private _loading = signal(false);

  // Acceso público readonly
  items   = this._items.asReadonly();
  loading = this._loading.asReadonly();

  // Derivados con computed
  total     = computed(() => this._items().reduce((acc, i) => acc + i.price * i.qty, 0));
  itemCount = computed(() => this._items().length);
  isEmpty   = computed(() => this._items().length === 0);

  addItem(product: Product): void {
    this._items.update(items => {
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        return items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...items, { ...product, qty: 1 }];
    });
  }

  removeItem(id: string): void {
    this._items.update(items => items.filter(i => i.id !== id));
  }

  clear(): void { this._items.set([]); }
}
```

---

## Opción 2: NgRx Signal Store (recomendado para features complejas)

```typescript
// npm install @ngrx/signals
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

interface ProductState {
  products:   Product[];
  selectedId: string | null;
  loading:    boolean;
  error:      string | null;
}

export const ProductStore = signalStore(
  { providedIn: 'root' },

  withState<ProductState>({
    products:   [],
    selectedId: null,
    loading:    false,
    error:      null,
  }),

  withComputed(({ products, selectedId }) => ({
    selectedProduct: computed(() => products().find(p => p.id === selectedId()) ?? null),
    totalProducts:   computed(() => products().length),
  })),

  withMethods((store, service = inject(ProductService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(()  => patchState(store, { loading: true, error: null })),
        exhaustMap(() => service.getAll()),
        tapResponse({
          next:  products => patchState(store, { products, loading: false }),
          error: (err: Error) => patchState(store, { error: err.message, loading: false }),
        }),
      ),
    ),

    selectProduct(id: string): void {
      patchState(store, { selectedId: id });
    },

    addProduct: rxMethod<Partial<Product>>(
      pipe(
        switchMap(data => service.create(data)),
        tap(product => patchState(store, {
          products: [...store.products(), product],
        })),
      ),
    ),
  })),
);

// Uso en componente
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductsPageComponent {
  store = inject(ProductStore);
  ngOnInit() { this.store.loadProducts(); }
}
// En template: store.products(), store.loading(), store.totalProducts()
```

---

## Opción 3: NgRx Clásico (solo para proyectos enterprise)

```typescript
// Acciones
export const loadUsers        = createAction('[Users] Load');
export const loadUsersSuccess = createAction('[Users] Load Success', props<{ users: User[] }>());
export const loadUsersFailure = createAction('[Users] Load Failure', props<{ error: string }>());

// Reducer
export const usersReducer = createReducer(
  initialState,
  on(loadUsers,        state       => ({ ...state, loading: true, error: null })),
  on(loadUsersSuccess, (state, { users }) => ({ ...state, users, loading: false })),
  on(loadUsersFailure, (state, { error }) => ({ ...state, error, loading: false })),
);

// Selectors
export const selectUsersState = createFeatureSelector<UsersState>('users');
export const selectUsers      = createSelector(selectUsersState, s => s.users);
export const selectLoading    = createSelector(selectUsersState, s => s.loading);

// Effect
@Injectable()
export class UsersEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.service.getAll().pipe(
          map(users  => loadUsersSuccess({ users })),
          catchError(err => of(loadUsersFailure({ error: err.message }))),
        )
      ),
    ),
  );
  constructor(
    private actions$: Actions,
    private service: UserService,
  ) {}
}
```

---

## linkedSignal — estado derivado y escribible

```typescript
// linkedSignal: se auto-resetea cuando cambia su dependencia,
// pero también puede ser modificado manualmente
export class ProductFiltersComponent {
  category = signal<string>('all');

  // Se resetea a 1 cuando cambia la categoría
  page = linkedSignal(() => {
    this.category(); // dependencia
    return 1;
  });

  // Con lógica de computación (forma avanzada)
  sortBy = linkedSignal<string, string>({
    source: this.category,
    computation: (newCategory, prev) => {
      // Al cambiar de categoría, resetear el sort
      // excepto si ya estábamos en 'price' (aplica a todas las categorías)
      if (prev?.value === 'price') return 'price';
      return newCategory === 'products' ? 'name' : 'date';
    }
  });

  nextPage()  { this.page.update(p => p + 1); }
  prevPage()  { this.page.update(p => Math.max(1, p - 1)); }
  goToPage(n: number) { this.page.set(n); }
}
```

---

## Persistencia de estado — Signals con URL y localStorage

```typescript
// Patrón: estado sincronizado con query params de URL
@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Lee desde URL al inicializar
  query    = toSignal(this.route.queryParams.pipe(map(p => p['q'] ?? '')),    { initialValue: '' });
  page     = toSignal(this.route.queryParams.pipe(map(p => Number(p['page'] ?? 1))), { initialValue: 1 });
  category = toSignal(this.route.queryParams.pipe(map(p => p['cat'] ?? 'all')), { initialValue: 'all' });

  // Actualizar URL (lo que automáticamente actualiza los signals)
  updateSearch(params: Partial<{ q: string; page: number; cat: string }>): void {
    this.router.navigate([], {
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}

// Patrón: estado persistido en localStorage
@Injectable({ providedIn: 'root' })
export class ThemeStateService {
  private readonly STORAGE_KEY = 'app-theme';

  private _isDark = signal<boolean>(this.loadFromStorage());

  isDark = this._isDark.asReadonly();

  constructor() {
    // Sincronizar con localStorage en cada cambio
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._isDark()));
    });
  }

  toggle(): void { this._isDark.update(v => !v); }

  private loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }
}
```

---

## Signals vs Observables — Cuándo usar cada uno

| Usa Signals                           | Usa Observables (RxJS)                  |
|---------------------------------------|-----------------------------------------|
| Estado sincrónico local o global      | Streams de eventos (WebSockets, clicks) |
| Valores derivados (`computed`)        | HTTP con retry, debounce, combinación   |
| Binding en templates                  | Múltiples fuentes de datos combinadas   |
| Estado derivado escribible (`linkedSignal`) | Transformaciones asíncronas encadenadas |
| Peticiones HTTP simples (`resource()`) | Lógica async compleja con operadores   |

### Puente entre ambos

```typescript
// Observable → Signal (se auto-limpia con el componente)
users = toSignal(this.userService.getAll(), { initialValue: [] });

// Signal → Observable
users$ = toObservable(this.usersSignal);

// Patrón búsqueda reactiva — signals + RxJS
export class SearchComponent {
  query = signal('');

  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q ? this.searchService.search(q) : of([])),
    ),
    { initialValue: [] },
  );
}

// Patrón búsqueda moderna — solo signals con resource() (Angular 19+)
export class SearchComponentModern {
  query = signal('');

  // resource se re-ejecuta automáticamente cuando cambia query
  resultsResource = httpResource<SearchResult[]>(
    () => this.query() ? `/api/search?q=${this.query()}` : null // null = no ejecutar
  );
}
```

---

## Configuración NgRx en app.config.ts (Angular 17+)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ users: usersReducer }),
    provideEffects(UsersEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};

// Feature state (lazy, en la ruta)
export const USER_ROUTES: Routes = [{
  path: '',
  providers: [
    provideState({ name: 'users', reducer: usersReducer }),
    provideEffects(UsersEffects),
  ],
  component: UsersPageComponent,
}];
```

---

## Anti-patrones a evitar

```typescript
// ❌ BehaviorSubject público mutable
class BadService {
  users$ = new BehaviorSubject<User[]>([]); // cualquiera puede hacer .next()
}
// ✅ Signal privado, readonly público
class GoodService {
  private _users = signal<User[]>([]);
  users = this._users.asReadonly();
}

// ❌ Subscribe sin cleanup
ngOnInit() { this.service.data$.subscribe(d => this.data = d); }
// ✅ takeUntilDestroyed o toSignal
private destroyRef = inject(DestroyRef);
data = toSignal(this.service.data$, { initialValue: [] });

// ❌ computed() para estado que necesita modificación manual
currentPage = computed(() => this.filters().page); // no escribible
// ✅ linkedSignal — derivado pero escribible
currentPage = linkedSignal(() => this.filters().page);

// ❌ Manejar loading/error HTTP manualmente si se puede usar resource()
private _loading = signal(false);
private _error   = signal<string | null>(null);
loadUsers() { /* setup manual de loading/error */ }
// ✅ resource() maneja loading/error automáticamente (Angular 19+)
usersResource = httpResource<User[]>('/api/users');
```

---

## Errores comunes en code review

| Error | Por qué es problema | Solución |
|-------|---------------------|----------|
| `BehaviorSubject` público | Cualquiera puede emitir → estado impredecible | Privatizar + `asReadonly()` |
| `computed()` para valores que se modifican | Rompe en runtime | Cambiar a `linkedSignal()` |
| Loading/error manual con signals + HTTP | Código repetitivo y propenso a bugs | Migrar a `resource()` en Angular 19+ |
| Estado de URL solo en signals locales | No compartible, no recargable | Sincronizar con query params |
| `subscribe()` sin cleanup en servicio | Memory leak en servicios singleton | Usar `takeUntilDestroyed` o `toSignal` |
