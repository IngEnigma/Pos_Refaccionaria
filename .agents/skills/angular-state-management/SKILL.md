---
name: Angular State Management
description: Use when implementing or reviewing state management in Angular applications, including signals, services, RxJS patterns, global state, component state, and best practices for reactive data flow.
---

# Skill: Angular State Management

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se maneje estado compartido entre componentes
- Se pida compartir datos entre rutas o módulos
- Se usen BehaviorSubject que puedan convertirse en signals
- El usuario mencione "store", "estado global", "NgRx", "signals", "reactivo"
- Haya props drilling excesivo entre componentes

---

## Árbol de decisión — ¿Qué solución usar?

```
¿El estado es local a un solo componente?
  └─ SÍ → signal() local en el componente

¿El estado es local a una feature?
  └─ SÍ → Service con signals (providedIn feature route)

¿El estado es global y la lógica es simple?
  └─ SÍ → Service con signals (providedIn: 'root')

¿El estado es global con lógica compleja o efectos async?
  └─ SÍ → NgRx Signal Store

¿Proyecto enterprise con equipo grande y devtools críticos?
  └─ SÍ → NgRx clásico (Redux)
```

---

## Opción 1: Service con Signals (default para la mayoría de casos)

```typescript
@Injectable({ providedIn: "root" })
export class CartService {
  // Estado privado — nunca exponer directamente
  private _items = signal<CartItem[]>([]);
  private _loading = signal(false);

  // Acceso público readonly
  items = this._items.asReadonly();
  loading = this._loading.asReadonly();

  // Derivados con computed
  total = computed(() => this._items().reduce((acc, item) => acc + item.price * item.qty, 0));
  itemCount = computed(() => this._items().length);
  isEmpty = computed(() => this._items().length === 0);

  addItem(product: Product): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.id === product.id);
      if (existing) {
        return items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...items, { ...product, qty: 1 }];
    });
  }

  removeItem(id: string): void {
    this._items.update((items) => items.filter((i) => i.id !== id));
  }

  clear(): void {
    this._items.set([]);
  }
}
```

---

## Opción 2: NgRx Signal Store (recomendado para features complejas)

```typescript
// npm install @ngrx/signals
import { signalStore, withState, withComputed, withMethods, patchState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";

interface ProductState {
  products: Product[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export const ProductStore = signalStore(
  { providedIn: "root" },

  withState<ProductState>({
    products: [],
    selectedId: null,
    loading: false,
    error: null,
  }),

  withComputed(({ products, selectedId }) => ({
    selectedProduct: computed(() => products().find((p) => p.id === selectedId()) ?? null),
    totalProducts: computed(() => products().length),
  })),

  withMethods((store, service = inject(ProductService)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        exhaustMap(() => service.getAll()),
        tapResponse({
          next: (products) => patchState(store, { products, loading: false }),
          error: (err: Error) => patchState(store, { error: err.message, loading: false }),
        }),
      ),
    ),

    selectProduct(id: string): void {
      patchState(store, { selectedId: id });
    },

    addProduct: rxMethod<Partial<Product>>(
      pipe(
        switchMap((data) => service.create(data)),
        tap((product) =>
          patchState(store, {
            products: [...store.products(), product],
          }),
        ),
      ),
    ),
  })),
);

// Uso en componente
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductsPageComponent {
  store = inject(ProductStore);
  ngOnInit() {
    this.store.loadProducts();
  }
}
// En template: store.products(), store.loading(), store.totalProducts()
```

---

## Opción 3: NgRx Clásico (solo para proyectos enterprise)

```typescript
// Acciones
export const loadUsers = createAction("[Users] Load");
export const loadUsersSuccess = createAction("[Users] Load Success", props<{ users: User[] }>());
export const loadUsersFailure = createAction("[Users] Load Failure", props<{ error: string }>());

// Reducer
export const usersReducer = createReducer(
  initialState,
  on(loadUsers, (state) => ({ ...state, loading: true, error: null })),
  on(loadUsersSuccess, (state, { users }) => ({ ...state, users, loading: false })),
  on(loadUsersFailure, (state, { error }) => ({ ...state, error, loading: false })),
);

// Selectors
export const selectUsersState = createFeatureSelector<UsersState>("users");
export const selectUsers = createSelector(selectUsersState, (s) => s.users);
export const selectLoading = createSelector(selectUsersState, (s) => s.loading);

// Effect
@Injectable()
export class UsersEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.service.getAll().pipe(
          map((users) => loadUsersSuccess({ users })),
          catchError((err) => of(loadUsersFailure({ error: err.message }))),
        ),
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

## Signals vs Observables — Cuándo usar cada uno

| Usa Signals                      | Usa Observables (RxJS)                  |
| -------------------------------- | --------------------------------------- |
| Estado sincrónico local o global | Streams de eventos (WebSockets, clicks) |
| Valores derivados (`computed`)   | HTTP con retry, debounce, combinación   |
| Binding en templates             | Múltiples fuentes de datos combinadas   |
| Estado de UI simple              | Transformaciones asíncronas encadenadas |

### Puente entre ambos

```typescript
// Observable → Signal (se auto-limpia con el componente)
users = toSignal(this.userService.getAll(), { initialValue: [] });

// Signal → Observable
users$ = toObservable(this.usersSignal);

// Patrón búsqueda reactiva con signals
export class SearchComponent {
  query = signal("");
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => (q ? this.searchService.search(q) : of([]))),
    ),
    { initialValue: [] },
  );
}
```

---

## Configuración NgRx en app.config.ts (Angular 17+)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [provideStore({ users: usersReducer }), provideEffects(UsersEffects), provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })],
};

// Feature state (lazy, en la ruta)
export const USER_ROUTES: Routes = [
  {
    path: "",
    providers: [provideState({ name: "users", reducer: usersReducer }), provideEffects(UsersEffects)],
    component: UsersPageComponent,
  },
];
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

// ✅ takeUntilDestroyed o async pipe
private destroyRef = inject(DestroyRef);
ngOnInit() {
  this.service.data$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(d => this.data = d);
}
```
