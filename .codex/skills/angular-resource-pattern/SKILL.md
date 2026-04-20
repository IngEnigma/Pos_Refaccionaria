---
name: angular-resource-pattern
description: Use when implementing data fetching in Angular 19+ applications with resource() or httpResource(). Covers reactive HTTP requests, loading/error states, mutation patterns, caching strategies, and migration from toSignal+HTTP patterns. Requires Angular 19+.
---

# Skill: Angular Resource Pattern
> Requiere Angular 19+ | Reemplaza patrones toSignal + HttpClient para peticiones de datos

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se hagan peticiones HTTP en componentes o servicios
- Se mencione `resource()`, `httpResource()`, "data fetching reactivo"
- El usuario maneje loading/error manualmente con signals
- Se use `toSignal(this.http.get(...))` — migrar a `httpResource()`
- Se pida invalidar o recargar datos tras una mutación
- Se pida cache, paginación reactiva, o búsqueda reactiva

---

## Árbol de decisión — ¿resource() o httpResource()?

```
¿Es una petición HTTP GET simple (sin lógica extra)?
  └─ SÍ → httpResource() — más conciso

¿Necesitas POST/PUT/DELETE o lógica async personalizada?
  └─ SÍ → resource() con loader async

¿La URL o los parámetros dependen de signals?
  └─ SÍ → Ambos son reactivos — elige según lo anterior

¿Estás en Angular < 19?
  └─ SÍ → toSignal() + HttpClient + signals manuales (ver sección de migración)
```

---

## httpResource — GET reactivo simple

```typescript
import { httpResource } from '@angular/core';

// Caso básico — URL estática
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductsComponent {
  products = httpResource<Product[]>('/api/products');

  // products.value()      → Product[] | undefined
  // products.isLoading()  → boolean
  // products.error()      → unknown
  // products.status()     → ResourceStatus (Idle | Loading | Resolved | Error | Refreshing | Local)
}

// Caso reactivo — URL depende de signals
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductListComponent {
  filters = signal({ category: 'all', page: 1, search: '' });

  // Se re-ejecuta automáticamente cuando cambia filters()
  products = httpResource<Product[]>(
    () => {
      const { category, page, search } = this.filters();
      const params = new URLSearchParams({ category, page: String(page) });
      if (search) params.set('q', search);
      return `/api/products?${params}`;
    }
  );

  // linkedSignal para resetear página al cambiar filtros
  // (ver angular-state-management para el patrón completo)
}

// En template
/*
@if (products.isLoading()) {
  <app-skeleton-list />
} @else if (products.error()) {
  <app-error-state [error]="products.error()" (retry)="products.reload()" />
} @else if (products.value(); as list) {
  @for (product of list; track product.id) {
    <app-product-card [product]="product" />
  } @empty {
    <p>Sin resultados</p>
  }
}
*/
```

---

## resource — Lógica async personalizada

```typescript
import { resource } from '@angular/core';

// Caso: petición con lógica custom (no solo fetch)
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class UserDetailComponent {
  userId = input.required<string>();

  user = resource({
    // request(): define las dependencias reactivas (signals)
    // Se re-ejecuta cuando cambia cualquier signal leído aquí
    request: () => ({ id: this.userId() }),

    // loader: función async que recibe { request, abortSignal }
    // abortSignal: se activa si el request cambia antes de resolverse
    loader: async ({ request, abortSignal }) => {
      const res = await fetch(`/api/users/${request.id}`, { signal: abortSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<User>;
    },
  });

  // Recargar manualmente (útil tras una mutación)
  refresh(): void { this.user.reload(); }

  // Actualización optimista local
  // No invalida el resource, útil para reflejar cambios inmediatos
  updateNameLocally(name: string): void {
    this.user.update(prev => prev ? { ...prev, name } : prev);
  }
}
```

---

## Mutaciones — Patrón recomendado

```typescript
// resource() es para LECTURA (GET). Para mutaciones (POST/PUT/DELETE),
// usar una función normal y luego recargar el resource.

@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class ProductsPageComponent {
  private http     = inject(HttpClient);
  private toastSvc = inject(ToastService);

  // Resource de lectura
  products = httpResource<Product[]>('/api/products');

  // Estado de mutación (independiente del resource)
  saving  = signal(false);
  deleting = signal<string | null>(null); // id del producto que se está borrando

  // Crear producto
  createProduct(data: CreateProductDto): void {
    this.saving.set(true);
    this.http.post<Product>('/api/products', data).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.toastSvc.success('Producto creado');
        this.products.reload(); // Invalida y recarga el resource
      },
      error: () => this.toastSvc.error('Error al crear el producto'),
    });
  }

  // Eliminación optimista
  deleteProduct(id: string): void {
    // 1. Optimista: eliminar de la lista local inmediatamente
    this.products.update(prev => prev?.filter(p => p.id !== id));
    this.deleting.set(id);

    this.http.delete(`/api/products/${id}`).pipe(
      finalize(() => this.deleting.set(null))
    ).subscribe({
      next:  () => this.toastSvc.success('Producto eliminado'),
      error: () => {
        // 2. Revertir si falla
        this.products.reload();
        this.toastSvc.error('Error al eliminar');
      },
    });
  }
}
```

---

## Paginación reactiva con resource

```typescript
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class PaginatedListComponent {
  // Parámetros de paginación como signals
  page     = signal(1);
  pageSize = signal(20);
  search   = signal('');

  // linkedSignal: resetear página al buscar
  currentPage = linkedSignal(() => {
    this.search(); // dependencia: resetear cuando cambia la búsqueda
    return 1;
  });

  // Resource reactivo — se re-ejecuta cuando cambia cualquier parámetro
  result = httpResource<PaginatedResponse<Product>>(
    () => {
      const params = new URLSearchParams({
        page:     String(this.currentPage()),
        pageSize: String(this.pageSize()),
        q:        this.search(),
      });
      return `/api/products?${params}`;
    }
  );

  // Computados para UI
  totalPages = computed(() =>
    Math.ceil((this.result.value()?.total ?? 0) / this.pageSize())
  );
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  nextPage(): void { if (this.hasNext()) this.currentPage.update(p => p + 1); }
  prevPage(): void { if (this.hasPrev()) this.currentPage.update(p => p - 1); }
}
```

---

## Peticiones dependientes (resource encadenado)

```typescript
// Cuando el segundo resource depende del resultado del primero
@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush })
export class OrderDetailComponent {
  orderId = input.required<string>();

  // Primer resource: cargar la orden
  order = httpResource<Order>(
    () => `/api/orders/${this.orderId()}`
  );

  // Segundo resource: cargar el cliente de la orden
  // Solo se ejecuta cuando order.value() tiene un customerId
  customer = httpResource<Customer>(
    () => {
      const customerId = this.order.value()?.customerId;
      // Retornar null/undefined cancela la petición
      if (!customerId) return null;
      return `/api/customers/${customerId}`;
    }
  );

  // El estado combinado para mostrar en UI
  isLoadingAll = computed(
    () => this.order.isLoading() || this.customer.isLoading()
  );
}
```

---

## Resource en Facades (Angular 19+)

```typescript
// Opción moderna: usar httpResource dentro del Facade
// (cuando la lógica de presentación no necesita el resource directamente)
@Injectable({ providedIn: 'root' })
export class ProductFacade {
  private filters = signal<ProductFilters>({ category: 'all', page: 1 });

  // Resource encapsulado en el Facade
  private productsResource = httpResource<Product[]>(
    () => `/api/products?${new URLSearchParams(this.filters() as any)}`
  );

  // Exponer como readonly al componente
  products  = this.productsResource.value;
  loading   = this.productsResource.isLoading;
  error     = this.productsResource.error;

  // Computados
  hasProducts = computed(() => (this.products() ?? []).length > 0);

  updateFilters(filters: Partial<ProductFilters>): void {
    this.filters.update(f => ({ ...f, ...filters }));
    // La actualización del resource es automática
  }

  refresh(): void { this.productsResource.reload(); }
}
```

---

## Migración desde toSignal + HttpClient

```typescript
// ❌ Patrón anterior (Angular 17/18)
@Component({})
export class OldProductsComponent {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  private _loading = signal(false);
  private _error   = signal<string | null>(null);
  private _filters = signal({ category: 'all' });

  products = toSignal(
    toObservable(this._filters).pipe(
      switchMap(filters => {
        this._loading.set(true);
        return this.http.get<Product[]>('/api/products', { params: filters }).pipe(
          finalize(() => this._loading.set(false)),
          catchError(err => {
            this._error.set(err.message);
            return of([]);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ),
    { initialValue: [] },
  );

  loading = this._loading.asReadonly();
  error   = this._error.asReadonly();
}

// ✅ Patrón moderno (Angular 19+)
@Component({})
export class NewProductsComponent {
  filters = signal({ category: 'all' });

  products = httpResource<Product[]>(
    () => `/api/products?category=${this.filters().category}`
  );

  // products.value()     === products anteriores
  // products.isLoading() === loading anterior
  // products.error()     === error anterior
  // — sin boilerplate, sin cleanup manual
}
```

---

## Errores comunes en code review

| Error | Por qué es problema | Solución |
|-------|---------------------|----------|
| `httpResource` para mutaciones | Solo es para lectura; POST/PUT/DELETE necesitan otro mecanismo | Usar `HttpClient` + `reload()` del resource |
| No retornar `null` cuando falta un parámetro | El resource dispara con parámetros incompletos | Retornar `null` o `undefined` en el request fn para cancelar |
| `resource` sin `abortSignal` en el loader | Peticiones anteriores no se cancelan al cambiar inputs | Siempre pasar `signal: abortSignal` al fetch |
| No llamar `reload()` tras mutación | La lista queda desactualizada | Llamar `resource.reload()` tras éxito en la mutación |
| `resource` para estado de UI local | Overhead innecesario | Usar `signal()` simple para estado que no viene de HTTP |
| `toSignal(http.get(...))` en Angular 19+ | Patrón obsoleto, más boilerplate | Migrar a `httpResource()` |
