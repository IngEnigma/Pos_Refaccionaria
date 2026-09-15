# Plan de Implementación — Frontend para Cambios del Backend

> Basado en: `docs/backend-changes-summary.md`
> Arquitectura: Clean Architecture / Hexagonal (Ports & Adapters) + SOLID
> Framework: Angular Standalone + Signals + OnPush

---

## Índice de Fases

- [Fase 1 — Arreglo de Tipos de Reporte](#fase-1--arreglo-de-tipos-de-reporte)
- [Fase 2 — Incluir `codigoSAT` en DTO de Producto](#fase-2--incluir-codigosat-en-dto-de-producto)
- [Fase 3 — Feature de Notificaciones](#fase-3--feature-de-notificaciones)
- [Fase 4 — Feature de Sucursales](#fase-4--feature-de-sucursales)
- [Fase 5 — Feature de Inventario por Sucursal](#fase-5--feature-de-inventario-por-sucursal)

---

## Fase 1 — Arreglo de Tipos de Reporte

**Prioridad:** Alta | **Esfuerzo:** Bajo (0.5–1 día) | **Dependencia:** Ninguna

El backend ya soporta `day`, `week`, `quincena`, `month`, `year`. El frontend solo soporta `day`, `week`, `biweek` (incorrecto), `month`.

### 1.1 Domain — `report-params.model.ts`

```
Tipo: 'day' | 'week' | 'quincena' | 'month' | 'year'

interface ReportParams {
  tipo: ReportType
  year?: number
  month?: number
  quincena?: number  // 1 | 2
}
```

- [x] Cambiar `'biweek'` → `'quincena'` (el backend usa `quincena`, no `biweek`)
- [x] Agregar `'year'` al tipo union
- [x] Agregar campo `quincena?: number` con validación de rango (1 | 2)

### 1.2 Infrastructure — `report-repository.impl.ts`

- [x] Cuando `tipo === 'quincena'`: enviar `year`, `month`, `quincena` como query params
- [x] Cuando `tipo === 'year'`: enviar solo `year` como query param
- [x] Mantener manejo de errores existente (Blob → text/plain)
- [x] Validar antes de enviar: `quincena` solo cuando tipo es `quincena`

### 1.3 Presentation — `reports.page.ts`

- [x] Agregar signal `selectedQuincena = signal<1 | 2>(1)`
- [x] Agregar `readonly quincenas = [{ value: 1, label: 'Primera Quincena' }, { value: 2, label: 'Segunda Quincena' }]`
- [x] Agregar lógica condicional en `generateReport()`:
  - `tipo === 'quincena'` → requiere `year`, `month`, `quincena`
  - `tipo === 'year'` → requiere solo `year`
- [x] Agregar validación: quincena es obligatoria cuando tipo es `quincena`

### 1.4 Presentation — `reports.page.html`

- [x] Agregar opción `"Quincenal"` y `"Anual"` al `<select>` de periodo
- [x] Agregar selector condicional de quincena cuando `tipo === 'quincena'`
- [x] Agregar selectores de mes/año condicionales cuando tipo es `quincena` (igual que `month`)
- [x] El selector de año solo se muestra para `month`, `quincena` y `year`
- [x] El selector de mes solo se muestra para `month` y `quincena`

### Checklist Fase 1

- [x] `domain/entities/report-params.model.ts` actualizado
- [x] `infrastructure/repositories/report-repository.impl.ts` actualizado
- [x] `presentation/pages/reports-page/reports.page.ts` actualizado
- [x] `presentation/pages/reports-page/reports.page.html` actualizado
- [x] Verificar que `quincena` y `year` funcionen con el backend (build OK)
- [ ] Pruebas unitarias del use-case actualizado

---

## Fase 2 — Incluir `codigoSAT` en DTO de Producto

**Prioridad:** Baja | **Esfuerzo:** Bajo (0.25 día) | **Dependencia:** Ninguna

El backend ya devuelve `codigoSAT` en la respuesta del serializer. Hay que asegurarse de que el frontend lo maneje.

### 2.1 Verificar DTOs

- [x] Revisar `application/dtos/product-response.dto.ts` — `codigoSAT` ya está mapeado correctamente
- [x] Revisar `application/dtos/product-create-request.dto.ts` — `codigoSAT` se envía al crear
- [x] Revisar `application/dtos/product-update-request.dto.ts` — `codigoSAT` se envía al actualizar

### 2.2 Domain — `product.entity.ts`

- [x] Verificar que `codigoSat` esté en la entidad `Product` — ya existe y está tipado como `string | null`

### 2.3 Infrastructure — `product.mapper.ts`

- [x] Verificar que el mapper incluya `codigoSat` en ambas direcciones (request y response) — ya mapea correctamente
- [x] **Mejora:** Se agregó normalización de cadenas vacías a `null` en el formulario para evitar persistir `''` en lugar de `null`

### 2.4 Presentation (si aplica)

- [x] El formulario de producto ya muestra `codigoSat` en `product-form-dialog.component.ts/html`
- [x] **Mejora:** Se agregó `Validators.maxLength(8)` al campo `codigoSat` para alinearse con el estándar del catálogo SAT
- [x] **Mejora:** Se implementó `normalizeOptionalString()` en `onSubmit()` para convertir cadenas vacías a `null` antes de enviar al backend
- [x] Verificar que la búsqueda por código de barras funcione (el backend ya la incluye)

### Checklist Fase 2

- [x] DTOs de producto verificados con `codigoSat`
- [x] Mapper verificado y funcionando en ambas direcciones
- [x] Formulario de producto verificado y mejorado (validación + normalización de null)
- [x] `codigoSat` se normaliza correctamente antes de persistir (evita enviar `''` al backend)
- [x] Build de aplicación (`tsconfig.app.json`) sin errores
- [x] **Extra:** Se corrigió error de sintaxis preexistente en `navbar.component.spec.ts` (faltaba cerrar `fakeAsync()`)

---

## Fase 3 — Feature de Notificaciones

**Prioridad:** Media | **Esfuerzo:** Medio (2–3 días) | **Dependencia:** Ninguna

El backend tiene una app `notifications` con CRUD de notificaciones. El frontend tiene un `NotificationService` in-memory en el shell. Se debe crear un feature completo.

### 3.1 Estructura de carpetas

```
src/app/features/notifications/
├── application/
│   ├── dtos/
│   │   ├── notification-response.dto.ts
│   │   └── notification-create-request.dto.ts
│   ├── usecase/
│   │   ├── get-notifications.usecase.ts
│   │   ├── mark-notification-read.usecase.ts
│   │   ├── mark-all-notifications-read.usecase.ts
│   │   └── delete-notification.usecase.ts
│   └── facades/
│       └── notifications.facade.ts
├── domain/
│   ├── entities/
│   │   └── notification.entity.ts
│   └── repository/
│       └── notification-repository.ts
├── infrastructure/
│   ├── mappers/
│   │   └── notification.mapper.ts
│   └── repositories/
│       └── notification-repository.impl.ts
├── presentation/
│   ├── components/
│   │   └── notification-item/
│   │       ├── notification-item.component.ts
│   │       ├── notification-item.component.html
│   │       └── notification-item.component.css
│   ├── notifications-badge/
│   │   ├── notifications-badge.component.ts
│   │   ├── notifications-badge.component.html
│   │   └── notifications-badge.component.css
│   └── pages/
│       └── notifications-page/
│           ├── notifications.page.ts
│           ├── notifications.page.html
│           └── notifications.page.css
├── notifications.routes.ts
└── index.ts
```

### 3.2 Domain

```
// notification.entity.ts
interface Notification {
  id: number
  titulo: string
  mensaje: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  leida: boolean
  creadoEn: Date
}

// notification-repository.ts (abstract)
abstract class NotificationRepository {
  abstract getNotifications(): Observable<Notification[]>
  abstract markAsRead(id: number): Observable<void>
  abstract markAllAsRead(): Observable<void>
  abstract delete(id: number): Observable<void>
}
```

### 3.3 Application — Use Cases

- [x] `GetNotificationsUseCase` — Obtener todas las notificaciones
- [x] `MarkNotificationReadUseCase` — Marcar una como leída
- [x] `MarkAllNotificationsReadUseCase` — Marcar todas como leídas
- [x] `DeleteNotificationUseCase` — Eliminar una notificación

### 3.4 Application — Facade

- [x] `NotificationsFacade` implementado con signals (`notifications`, `unreadCount`, `loading`, `errorMessage`)
- [x] Optimistic updates: el estado local se actualiza inmediatamente antes de confirmar con el backend

### 3.5 Infrastructure

- [x] `NotificationRepositoryImpl` — HTTP calls a `{apiUrl}/notifications/`
- [x] `NotificationMapper` — DTO ↔ Entity (mapea `creado_en` string → `Date`)
- [x] Registrado en `app.config.ts` como provider global (`useClass: NotificationRepositoryImpl`)

### 3.6 Presentation

- [x] `NotificationsBadgeComponent` — Icono de campana con badge de unread count, dropdown con lista de notificaciones y acciones
- [x] `NotificationItemComponent` — Item individual con icono por tipo, título, mensaje, fecha y acciones (marcar leída / eliminar)
- [x] `NotificationsPageComponent` — Página dedicada `/notifications` con lista completa
- [x] Integrado en `NavbarComponent` (reemplazado el dropdown manual de notificaciones)
- [x] Usa `DropdownComponent` de shared/ui para el panel de notificaciones

### 3.7 Integración con Shell

- [x] Agregado item de notificaciones al sidebar: `{ id: 'notifications', label: 'Notificaciones', icon: 'bell', route: '/notifications', roles: ['admin', 'seller', 'manager'] }`
- [x] Actualizado `NavbarComponent` para usar `NotificationsBadgeComponent` en lugar del input `notifications`
- [x] `NotificationPort` del shell se mantiene intacto para compatibilidad con otros consumidores

### 3.8 Endpoints del Backend (estimados)

```
GET    /api/notifications/          — Listar notificaciones
PATCH  /api/notifications/{id}/     — Marcar como leída
POST   /api/notifications/mark-all/ — Marcar todas como leídas
DELETE /api/notifications/{id}/     — Eliminar notificación
```

### Checklist Fase 3

- [x] Estructura de carpetas creada
- [x] Domain: entity + repository definidos
- [x] Application: use-cases + facade implementados
- [x] Infrastructure: repository impl + mapper implementados
- [x] Presentation: badge + item + page components creados
- [x] Integración en navbar
- [x] Routing registrado en `app.routes.ts` (`/notifications`)
- [x] Sidebar actualizado
- [x] Providers registrados en `app.config.ts`
- [x] Build de aplicación (`tsconfig.app.json`) sin errores
- [ ] Pruebas unitarias (pendiente — sigue el patrón del resto del proyecto)

---

## Fase 4 — Feature de Sucursales

**Prioridad:** Media | **Esfuerzo:** Medio-Alto (2–3 días) | **Dependencia:** Ninguna (pero se recomienda después de Fase 3)

El backend tiene una app `sucursales` con CRUD de sucursales.

### 4.1 Estructura de carpetas

```
src/app/features/branches/
├── application/
│   ├── dtos/
│   │   ├── branch-response.dto.ts
│   │   ├── branch-create-request.dto.ts
│   │   └── branch-update-request.dto.ts
│   ├── usecase/
│   │   ├── get-branches.usecase.ts
│   │   ├── get-branch-by-id.usecase.ts
│   │   ├── create-branch.usecase.ts
│   │   ├── update-branch.usecase.ts
│   │   └── delete-branch.usecase.ts
│   └── facades/
│       └── branches.facade.ts
├── domain/
│   ├── entities/
│   │   └── branch.entity.ts
│   └── repository/
│       └── branch-repository.ts
├── infrastructure/
│   ├── mappers/
│   │   └── branch.mapper.ts
│   └── repositories/
│       └── branch-repository.impl.ts
├── presentation/
│   ├── pages/
│   │   └── branches-page/
│   │       ├── branches.page.ts
│   │       ├── branches.page.html
│   │       └── branches.page.css
│   └── components/
│       ├── branch-form-dialog/
│       │   ├── branch-form-dialog.component.ts
│       │   ├── branch-form-dialog.component.html
│       │   └── branch-form-dialog.component.css
│       └── branch-card/
│           ├── branch-card.component.ts
│           ├── branch-card.component.html
│           └── branch-card.component.css
├── branches.routes.ts
└── index.ts
```

### 4.2 Domain

```
// branch.entity.ts
interface Branch {
  id: number
  nombre: string
  direccion: string
  telefono: string
  activa: boolean
}

// branch-repository.ts (abstract)
abstract class BranchRepository {
  abstract getBranches(): Observable<Branch[]>
  abstract getById(id: number): Observable<Branch>
  abstract create(payload: CreateBranchPayload): Observable<Branch>
  abstract update(id: number, payload: UpdateBranchPayload): Observable<Branch>
  abstract delete(id: number): Observable<void>
}
```

### 4.3 Presentation — Página

- [x] `BranchesPageComponent` — Lista de sucursales en grid/card layout
- [x] `BranchFormDialogComponent` — Modal para crear/editar sucursal con toggle de estado
- [x] `BranchCardComponent` — Tarjeta de sucursal con acciones (editar, eliminar) y badge de estado

### 4.4 Routing y Navegación

- [x] Crear `branches.routes.ts` con path `''` → `BranchesPageComponent`
- [x] Registrar en `app.routes.ts`: `path: 'branches'` con lazy loading
- [x] Agregar al sidebar: `{ id: 'branches', label: 'Sucursales', icon: 'building', route: '/branches', roles: ['admin'] }`

### 4.5 Endpoints del Backend (estimados)

```
GET    /api/sucursales/             — Listar sucursales
GET    /api/sucursales/{id}/        — Obtener sucursal
POST   /api/sucursales/             — Crear sucursal
PUT    /api/sucursales/{id}/        — Actualizar sucursal
DELETE /api/sucursales/{id}/        — Eliminar sucursal
```

### Checklist Fase 4

- [x] Estructura de carpetas creada
- [x] Domain: entity + repository definidos
- [x] Application: use-cases + facade implementados
- [x] Infrastructure: repository impl + mapper implementados
- [x] Presentation: página + componentes creados
- [x] Routing registrado
- [x] Sidebar actualizado
- [x] Providers registrados en `app.config.ts`
- [ ] Pruebas unitarias

> **Build OK:** Compilación exitosa (`ng build` genera el lazy chunk `branches-page`). Se corrigió un error preexistente en `notifications-badge.component.html` (`disabled` → `[disabled]="true"`) que rompía el build.

---

## Fase 5 — Feature de Inventario por Sucursal

**Prioridad:** Alta | **Esfuerzo:** Alto (3–5 días) | **Dependencia:** Fase 4 (Sucursales)

El backend tiene una app `inventario` con modelos `Inventario`, `DetalleInventario`, `MovimientoInventario` vinculados a sucursales.

### 5.1 Estructura de carpetas

```
src/app/features/inventory-by-branch/
├── application/
│   ├── dtos/
│   │   ├── inventory-response.dto.ts
│   │   ├── inventory-detail-response.dto.ts
│   │   ├── movement-response.dto.ts
│   │   └── movement-create-request.dto.ts
│   ├── usecase/
│   │   ├── get-inventory-by-branch.usecase.ts
│   │   ├── get-inventory-detail.usecase.ts
│   │   ├── get-movements.usecase.ts
│   │   ├── create-movement.usecase.ts
│   │   └── transfer-inventory.usecase.ts
│   └── facades/
│       └── inventory-by-branch.facade.ts
├── domain/
│   ├── entities/
│   │   ├── inventory.entity.ts
│   │   ├── inventory-detail.entity.ts
│   │   └── inventory-movement.entity.ts
│   └── repository/
│       ├── inventory-repository.ts
│       └── movement-repository.ts
├── infrastructure/
│   ├── mappers/
│   │   ├── inventory.mapper.ts
│   │   └── movement.mapper.ts
│   └── repositories/
│       ├── inventory-repository.impl.ts
│       └── movement-repository.impl.ts
├── presentation/
│   ├── pages/
│   │   └── inventory-page/
│   │       ├── inventory.page.ts
│   │       ├── inventory.page.html
│   │       └── inventory.page.css
│   └── components/
│       ├── branch-selector/
│       ├── inventory-table/
│       ├── movement-form-dialog/
│       └── movement-list/
├── inventory-by-branch.routes.ts
└── index.ts
```

### 5.2 Domain

```
// inventory.entity.ts
interface Inventory {
  id: number
  idSucursal: number
  sucursal?: string  // nombre de la sucursal
  productos: InventoryDetail[]
}

// inventory-detail.entity.ts
interface InventoryDetail {
  id: number
  idProducto: number
  producto?: string  // nombre del producto
  cantidad: number
  existencia: number
}

// inventory-movement.entity.ts
interface InventoryMovement {
  id: number
  idSucursal: number
  idProducto: number
  tipo: 'entrada' | 'salida' | 'transferencia'
  cantidad: number
  fecha: Date
  usuario?: string
}

// inventory-repository.ts (abstract)
abstract class InventoryRepository {
  abstract getByBranch(branchId: number): Observable<Inventory>
  abstract getDetail(branchId: number, productId: number): Observable<InventoryDetail>
}

// movement-repository.ts (abstract)
abstract class MovementRepository {
  abstract getMovements(branchId: number, filters?: MovementFilters): Observable<InventoryMovement[]>
  abstract create(payload: CreateMovementPayload): Observable<InventoryMovement>
  abstract transfer(payload: TransferPayload): Observable<InventoryMovement>
}
```

### 5.3 Application — Use Cases

- [ ] `GetInventoryByBranchUseCase` — Obtener inventario de una sucursal
- [ ] `GetInventoryDetailUseCase` — Detalle de un producto en sucursal
- [ ] `GetMovementsUseCase` — Historial de movimientos de una sucursal
- [ ] `CreateMovementUseCase` — Registrar entrada/salida de inventario
- [ ] `TransferInventoryUseCase` — Transferir entre sucursales

### 5.4 Presentation

- [ ] `BranchSelectorComponent` — Selector de sucursal (dropdown o tabs)
- [ ] `InventoryTableComponent` — Tabla de productos con existencia en sucursal
- [ ] `MovementFormDialogComponent` — Modal para registrar entrada/salida
- [ ] `MovementListComponent` — Lista de movimientos recientes

### 5.5 Routing y Navegación

- [ ] Crear `inventory-by-branch.routes.ts` con path `''` → `InventoryPageComponent`
- [ ] Registrar en `app.routes.ts`: `path: 'inventory-by-branch'` con lazy loading
- [ ] Agregar al sidebar: `{ id: 'inventory-by-branch', label: 'Inventario Sucursal', icon: 'warehouse', route: '/inventory-by-branch', roles: ['admin', 'manager'] }`
- [ ] Actualizar el sidebar existente de "Inventario" si ahora es por sucursal, o mantenerlo como "Catálogo de Productos"

### 5.6 Endpoints del Backend (estimados)

```
GET    /api/inventario/sucursal/{id}/          — Inventario por sucursal
GET    /api/inventario/sucursal/{id}/detalle/{productId}/ — Detalle producto
GET    /api/inventario/movimientos/?sucursal={id} — Movimientos de sucursal
POST   /api/inventario/movimientos/            — Registrar movimiento
POST   /api/inventario/transferencia/          — Transferir entre sucursales
```

### 5.7 Integración con Productos

- [ ] Actualizar `features/inventory/` para distinguir entre "Catálogo de Productos" (productos base) e "Inventario por Sucursal" (existencias)
- [ ] Si el producto ahora tiene `codigoSAT`, incluirlo en el detalle de inventario
- [ ] El módulo de ventas (`features/sales/`) podría necesitar saber la sucursal actual para descontar inventario

### Checklist Fase 5

- [ ] Estructura de carpetas creada
- [ ] Domain: entities + repositories definidos
- [ ] Application: use-cases + facade implementados
- [ ] Infrastructure: repository impl + mapper implementados
- [ ] Presentation: página + componentes creados
- [ ] Routing registrado
- [ ] Sidebar actualizado
- [ ] Providers registrados en `app.config.ts`
- [ ] Pruebas unitarias
- [ ] Integración con módulo de ventas (si aplica)

---

## Resumen de Prioridades

| Fase | Prioridad | Esfuerzo | Depende de |
|------|-----------|----------|------------|
| **1** — Arreglo de Tipos de Reporte | Alta | 0.5–1 día | — |
| **2** — `codigoSAT` en DTO | Baja | 0.25 día | — |
| **3** — Notificaciones | Media | 2–3 días | — |
| **4** — Sucursales | Media | 2–3 días | — |
| **5** — Inventario por Sucursal | Alta | 3–5 días | Fase 4 |

## Orden de ejecución recomendado

```
Fase 1 ──→ Fase 2 ──→ Fase 3 ──→ Fase 4 ──→ Fase 5
(Reportes)  (DTO)     (Notif.)    (Sucursales) (Inventario)
```

> **Nota:** Las Fases 1 y 2 son independientes y pueden hacerse en paralelo.
> Las Fases 3 y 4 son independientes entre sí pero son prerequisitos para la Fase 5.
> Se recomienda hacer primero las fases de menor esfuerzo (1, 2) para liberarlas rápidamente.

---

## Consideraciones de Arquitectura

### Clean Architecture — Capas por feature

| Capa | Responsabilidad | Regla de dependencia |
|------|-----------------|----------------------|
| **Domain** | Entities, Value Objects, Repository (abstract), Domain Errors | No depende de nadie |
| **Application** | Use Cases, DTOs, Facades | Depende de Domain |
| **Infrastructure** | Repository Impl, Mappers, HTTP | Depende de Application (implementa puertos) |
| **Presentation** | Pages, Components, State | Depende de Application (facades) |

### SOLID

- **S** — Cada use-case tiene una sola responsabilidad
- **O** — Los repositorios se extienden vía implementación, no modificación
- **L** — Los impls son sustituibles por sus abstracciones
- **I** — Los puertos son interfaces pequeñas y específicas
- **D** — Los componentes dependen de abstracciones (puertos), no de implementaciones

### Patrones utilizados

| Patrón | Uso |
|--------|-----|
| **Repository** | Abstracción de acceso a datos |
| **Facade** | Orquestación de use-cases y estado |
| **DTO** | Transferencia de datos entre capas |
| **Mapper** | Transformación DTO ↔ Entity |
| **Port/Adapter** | Inversión de dependencias |
| **Signal** | Estado reactivo en presentation |
| **OnPush** | Change detection optimizada |

### Registro de Providers

- Los repositorios se registran como `abstract class` en `app.config.ts` usando `useClass` o `useExisting`.
- Los facades se registran como `@Injectable({ providedIn: 'root' })`.
- Los use-cases se registran como `@Injectable({ providedIn: 'root' })`.

```typescript
// app.config.ts (ejemplo)
providers: [
  { provide: BranchRepository, useClass: BranchRepositoryImpl },
  { provide: InventoryRepository, useClass: InventoryRepositoryImpl },
  { provide: MovementRepository, useClass: MovementRepositoryImpl },
  { provide: NotificationRepository, useClass: NotificationRepositoryImpl },
]
```

---

## Archivos a modificar en cada fase

### Fase 1 — Reportes
| Archivo | Acción |
|---------|--------|
| `domain/entities/report-params.model.ts` | Modificar |
| `infrastructure/repositories/report-repository.impl.ts` | Modificar |
| `presentation/pages/reports-page/reports.page.ts` | Modificar |
| `presentation/pages/reports-page/reports.page.html` | Modificar |

### Fase 2 — Producto DTO
| Archivo | Acción |
|---------|--------|
| `application/dtos/product-response.dto.ts` | Verificar (ya estaba correcto) |
| `application/dtos/product-create-request.dto.ts` | Verificar (ya estaba correcto) |
| `application/dtos/product-update-request.dto.ts` | Verificar (ya estaba correcto) |
| `infrastructure/mappers/product.mapper.ts` | Verificar (ya estaba correcto) |
| `domain/entities/product.entity.ts` | Verificar (ya estaba correcto) |
| `domain/repository/product-repository.ts` | Verificar (ya estaba correcto) |
| `presentation/components/product-form-dialog/product-form-dialog.component.ts` | Modificar (normalización + validación) |
| `shell/components/navbar/navbar.component.spec.ts` | Corregir error de sintaxis preexistente |

### Fase 3 — Notificaciones (todo nuevo)
| Archivo | Acción |
|---------|--------|
| `domain/entities/notification.entity.ts` | Crear |
| `domain/repository/notification-repository.ts` | Crear |
| `application/dtos/*.ts` | Crear |
| `application/usecase/*.ts` | Crear |
| `application/facades/notifications.facade.ts` | Crear |
| `infrastructure/mappers/notification.mapper.ts` | Crear |
| `infrastructure/repositories/notification-repository.impl.ts` | Crear |
| `presentation/components/notification-item/*` | Crear |
| `presentation/components/notifications-badge/*` | Crear |
| `presentation/pages/notifications-page/*` | Crear |
| `notifications.routes.ts` | Crear |
| `index.ts` | Crear |
| `app.config.ts` | Modificar (provider + íconos) |
| `app.routes.ts` | Modificar |
| `app-routes.ts` | Modificar (agregar `notifications`) |
| `sidebar-menu.defaults.ts` | Modificar |
| `navbar.component.ts` | Modificar |
| `navbar.component.html` | Modificar |
| `navbar.component.spec.ts` | Modificar (mock del nuevo componente) |
| `main-layout.component.ts` | Modificar (eliminar binding de notificaciones) |
| `main-layout.component.html` | Modificar (eliminar input de notificaciones) |

### Fase 4 — Sucursales (todo nuevo)
| Archivo | Acción |
|---------|--------|
| `domain/entities/branch.entity.ts` | Crear |
| `domain/repository/branch-repository.ts` | Crear |
| `application/dtos/*.ts` | Crear |
| `application/usecase/*.ts` | Crear |
| `application/facades/branches.facade.ts` | Crear |
| `infrastructure/mappers/branch.mapper.ts` | Crear |
| `infrastructure/repositories/branch-repository.impl.ts` | Crear |
| `presentation/pages/branches-page/*` | Crear |
| `presentation/components/branch-form-dialog/*` | Crear |
| `presentation/components/branch-card/*` | Crear |
| `branches.routes.ts` | Crear |
| `index.ts` | Crear |
| `app.config.ts` | Modificar |
| `app.routes.ts` | Modificar |
| `sidebar-menu.defaults.ts` | Modificar |

### Fase 5 — Inventario por Sucursal (todo nuevo)
| Archivo | Acción |
|---------|--------|
| `domain/entities/*.ts` | Crear |
| `domain/repository/*.ts` | Crear |
| `application/dtos/*.ts` | Crear |
| `application/usecase/*.ts` | Crear |
| `application/facades/*.ts` | Crear |
| `infrastructure/mappers/*.ts` | Crear |
| `infrastructure/repositories/*.ts` | Crear |
| `presentation/pages/inventory-page/*` | Crear |
| `presentation/components/branch-selector/*` | Crear |
| `presentation/components/inventory-table/*` | Crear |
| `presentation/components/movement-form-dialog/*` | Crear |
| `presentation/components/movement-list/*` | Crear |
| `inventory-by-branch.routes.ts` | Crear |
| `index.ts` | Crear |
| `app.config.ts` | Modificar |
| `app.routes.ts` | Modificar |
| `sidebar-menu.defaults.ts` | Modificar |
