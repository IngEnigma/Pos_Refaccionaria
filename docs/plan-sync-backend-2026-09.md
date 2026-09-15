# Plan de Implementación — Sincronización Frontend con Backend (Develop)

> **Fecha:** 2026-09-01
> **Origen:** Pull de `RefaccionariaBack` rama `Develop` (`04c34e7 → 42ff9bd`, +6033/-790 líneas)
> **Arquitectura objetivo:** Clean Architecture / Hexagonal (Ports & Adapters) + SOLID
> **Framework:** Angular 18 Standalone + Signals + OnPush
> **Predecesor:** `docs/plan-implementacion.md` (Fases 1–4 completadas; este documento reemplaza la Fase 5 y agrega los cambios nuevos)

---

## 1. Resumen de cambios detectados en el Backend

### 1.1 Apps NUEVAS (ya mergeadas en Develop)

| App | Modelos | Endpoints |
|-----|---------|-----------|
| **`sucursales`** | `Sucursal{id, nombre_sucursal, codigo_sucursal (auto SUC-XXXXXX), ubicacion, codigo_postal, numero_telefono, correo_electronico}` | `GET/POST /api/sucursales/` · `GET/PUT/DELETE /api/sucursales/{id}/` |
| **`clientes`** | `Cliente{id, id_sucursal (FK), nombre, apellido_paterno, apellido_materno?, telefono, correo?, direccion?, rfc?, created_at, updated_at}` | `GET/POST /api/clientes/` · `GET/PUT/DELETE /api/clientes/{id}/` |
| **`inventario`** | `Inventario{id, id_sucursal, descripcion}` · `MovimientoInventario{id, tipo: ENTRADA\|SALIDA, cantidad, fecha, razon, observaciones?}` · `DetalleInventario{id, id_producto, id_inventario, id_proveedor?, id_movimiento, id_detalle_venta?, cantidad, update_at}` · `PrecioSucursal{id, id_producto, id_sucursal, precio_venta, vigente_desde, activo}` | `GET /api/inventarios/mi-sucursal/` (usa perfil del JWT) · CRUD `/api/inventarios/` · CRUD `/api/movimientos-inventario/` · CRUD `/api/detalles-inventario/` + `POST /api/detalles-inventario/bulk/` · CRUD `/api/precios-sucursal/` + `GET /api/precios-sucursal/activo/?id_producto=&id_sucursal=` + `GET /api/precios-sucursal/historial/?id_producto=&id_sucursal=` |

**Detalles importantes de serialización:**

- `SucursalService._to_dict()` **solo devuelve `{id, ubicacion}`**. El resto de campos existen en el modelo pero no se exponen. ⚠️ Se recomienda pedir al backend que amplíe el serializer (ver §7) o el frontend trabaja solo con esos dos campos.
- `GET /api/inventarios/mi-sucursal/` responde:
  ```json
  [{
    "id_inventario": 1, "descripcion": "...", "id_sucursal": 1,
    "detalles": [{
      "id": 5, "id_producto": 2, "nombre": "...", "clave": "...", "marca": "...",
      "codigo_barras": "...", "precio_venta": "120.00", "precio_sucursal": "115.00|null",
      "vigente_desde": "ISO|null", "precio_base": "120.00", "costo": "80.00",
      "cantidad": 7
    }]
  }]
  ```
- **Stock = suma algebraica de detalles** (ENTRADA suma, SALIDA resta). No hay columna de existencia: el stock se calcula con movimientos.
- `DetalleInventario` puede auto-crear su `MovimientoInventario` si no se envía `id_movimiento` (se aceptan `tipo_movimiento`, `razon`, `observaciones` inline). Valida stock suficiente en SALIDAS (transaccional, con `select_for_update`).
- `PrecioSucursal`: solo puede haber **un precio activo por (producto, sucursal)** (constraint `uniq_precio_activo`). Al crear/activar uno nuevo, el anterior se desactiva automáticamente.

### 1.2 Apps MODIFICADAS

#### Producto (breaking changes)
- ❌ **Eliminado** el campo `existencia` (migración `0004_remove_producto_existencia`).
- ❌ **Eliminados** `MovimientoController`, `MovimientoService`, `MovimientoRepository` de la app `producto` → **el endpoint `GET /api/movimientos/` ya NO existe**.
- ✅ `codigoSAT` sigue presente; el `search` ahora incluye `codigo_barras` y `descripcion`.
- ✅ `GET /api/productos/` acepta query params: `page`, `page_size`, `sucursal_id`, `search`, `clave`, `marca`, `codigo_barras`, `tipo_id`, `proveedor_id`.
  - Con `sucursal_id`: devuelve solo productos **con stock > 0** en esa sucursal, enriquecidos con `precio_sucursal`, `vigente_desde`, `cantidad` (stock), `id_sucursal`, `precio_base`.
- ✅ **Nuevo endpoint de búsqueda por código de barras** (`producto/urls.py:8`, `ProductoPorCodigoBarrasView`):
  - `GET /api/productos/codigo-barras/?codigo_barras=XXX`
  - Respuesta 200: el `_to_dict` estándar del producto → `{id, id_tipo, id_proveedor, clave, nombre, descripcion, codigo_barras, precio_venta, marca, costo}` (sin `codigoSAT` — ver §7, nota para backend).
  - Respuesta 400 si falta el parámetro: `{"error": "Debe enviar el parámetro codigo_barras"}`.
  - Respuesta 404 si no existe: `{"error": "Producto no encontrado"}`.
  - ⚠️ **La búsqueda es global (exacta, case-sensitive), NO por sucursal**: la respuesta **no incluye stock (`cantidad`) ni `precio_sucursal`**. Para el POS hay que cruzar el resultado con el catálogo por sucursal (`productos?sucursal_id=`) para conocer stock/precio efectivo.
- ⚠️ La ruta `/api/productos/search/` **ya no existe** (la búsqueda es un query param de `/productos/`).

#### Ventas (breaking changes)
- `venta` ahora tiene **`id_inventario` (FK, OBLIGATORIO al crear)**.
- `POST /api/ventas/` **ignora `id_usuario` del payload**: lo toma del JWT.
- `detalleVenta`:
  - Valida que el producto tenga **stock > 0 en el inventario de la venta**.
  - **Bloqueo cross-sucursal**: si el usuario tiene perfil con sucursal (y no es staff), solo puede operar ventas de su sucursal.
  - El `subtotal` se calcula con **precio por sucursal** (`PrecioSucursal` activo) con fallback a `Producto.precio_venta`.
  - Al crear/actualizar/eliminar un detalle se crea/ajusta/revierte automáticamente la SALIDA de inventario y se recalcula el total de la venta.
- ⚠️ El detalle está en `/api/detalleventa/` (el frontend usa `/detalle/`).

#### Usuario
- Nuevo modelo `Perfil{id, usuario (OneToOne), id_sucursal (FK, nullable)}`.
- Nuevo endpoint `GET/PUT /api/perfil/` (get-or-create del perfil del usuario autenticado; PUT acepta `{id_sucursal}`).
- `POST /api/users` acepta ahora `id_sucursal` (crea el Perfil asociado).
- Login responde `{refresh, access, user:{id, username, isadmin, isstaff}}` (sin cambios).
- Refresh token en `/api/token/refresh`.

#### Notifications
- La app existe con migraciones, pero **NO está registrada en `RTR/urls.py`** → los endpoints no están expuestos. El feature de notificaciones del frontend (Fase 3 del plan anterior) queda **en espera** hasta que el backend la publique.

---

## 2. Estado actual del Frontend vs Backend (GAPS)

| # | Feature frontend | Estado | Problema |
|---|------------------|--------|----------|
| G1 | `features/movements` (`/movimientos`) | 💥 **ROTO** | El endpoint fue eliminado del backend. Todo el feature quedó huérfano. |
| G2 | `features/inventory-by-branch` | ✅ **REESCRITO** | Reescrito completamente contra endpoints reales: `/inventarios/mi-sucursal/`, `/movimientos-inventario/`, `/detalles-inventario/bulk/`. Eliminada UI de transferencias. |
| G3 | `features/branches` | ⚠️ **DESALINEADO** | Entidad `{nombre, direccion, telefono, activa}` ≠ modelo real `{nombre_sucursal, codigo_sucursal, ubicacion, codigo_postal, numero_telefono, correo_electronico}`. Además el serializer solo devuelve `{id, ubicacion}`. |
| G4 | `features/sales` | 💥 **ROTO** | 1) `SALE_ENDPOINTS.DETAIL='/detalle/'` → real: `/detalleventa/`. 2) `createSale` no envía `id_inventario` (obligatorio). 3) El carrito no conoce la sucursal del usuario. 4) Errores nuevos: stock insuficiente / cross-sucursal deben mostrarse al usuario. |
| G5 | `features/inventory` (productos) | 💥 **ROTO** | 1) `searchProducts` pega a `/productos/search/?query=` (ruta inexistente). 2) Entidad `Product` tiene `existencia` e `idMovimientos` (eliminados en backend). 3) No aprovecha `sucursal_id` ni los filtros nuevos. |
| G6 | `features/auth` | ⚠️ **REVISAR** | `AUTH_ENDPOINTS.REFRESH='/refresh'` pero el backend expone `/token/refresh`. (Verificar en integración; puede estar roto silenciosamente.) |
| G7 | `features/users` (clients) | ⚠️ **MOCK** | Página `clients.page.ts` es 100% mock, sin ruta. El backend ahora tiene `/api/clientes/` real con más campos. |
| G8 | Clientes (real) | ❌ **NO EXISTE** | Falta feature completo contra `/api/clientes/`. |
| G9 | Precios por sucursal | ❌ **NO EXISTE** | Falta feature contra `/api/precios-sucursal/` (activo/historial). |
| G10 | Perfil de usuario | ❌ **NO EXISTE** | Falta consumo de `GET/PUT /api/perfil/`; el navbar no muestra ni permite editar la sucursal asignada. |
| G11 | Notificaciones | ⏸️ **EN ESPERA** | Frontend listo (Fase 3), pero el backend no expone la app. No tocar. |

---

## 3. Índice de Fases

| Fase | Nombre | Prioridad | Esfuerzo | Depende de |
|------|--------|-----------|----------|------------|
| **0** | Hotfixes de contrato (endpoints rotos) | 🔴 Crítica | 0.5 día | — |
| **1** | Perfil de usuario + sucursal en sesión | 🔴 Alta | 1 día | — |
| **2** | Re-alineación de Sucursales | 🔴 Alta | 0.5 día | — |
| **3** | Productos: limpieza de entidad + búsqueda/filtros nuevos | 🟠 Media | 1 día | — |
| **4** | Reescritura de Inventario por Sucursal | 🔴 Alta | 2–3 días | Fases 1, 2 |
| **5** | Ventas: integración con inventario y precio por sucursal | 🔴 Alta | 2 días | Fases 1, 4 |
| **6** | Feature Clientes (real) | 🟠 Media | 2 días | Fase 2 |
| **7** | Precios por Sucursal (admin) | 🟡 Baja | 1–2 días | Fases 2, 3 |
| **8** | Retiro del feature `movements` huérfano | 🟡 Baja | 0.25 día | Fase 4 |

Orden recomendado: **0 → 1 → 2 → 3 → 4 → 5 → (6 ‖ 7) → 8**

---

## Fase 0 — Hotfixes de contrato (desbloqueo inmediato)

> Cambios mínimos para que lo que hoy está roto deje de estarlo, sin rediseñar nada.

### 0.1 Auth — endpoint de refresh
- [x] `features/auth/config/auth-endpoints.ts`: `REFRESH: '/refresh'` → `'/token/refresh'`.
- [x] Verificar `SessionMapper.fromLoginResponse` contra el payload real `{access, refresh, user:{id, username, isadmin, isstaff}}` — agregado `normalizeUser` para manejar `isadmin`/`isadmin` fallback.
- [x] Prueba manual: login + expiración de access token + retry automático.

### 0.2 Sales — endpoint de detalle
- [x] `features/sales/config/sale-endpoints.ts`: `DETAIL: '/detalle/'` → `'/detalleventa/'`.
- [x] Verificar que `sales-history` (modal de detalle) vuelva a funcionar.

### 0.3 Productos — búsqueda
- [x] `features/inventory/infrastructure/repositories/product-repository.impl.ts`:
  - `searchProducts`: `GET {endpoint}/search/?query=...` → `GET {endpoint}?search=...` (misma paginación `page`/`page_size`).
  - La paginación ya tolera `results`/`page_size` — sin cambios de mapper.
- [x] Smoke test del buscador en `inventory.page` y en POS (`sales.page`).

### Checklist Fase 0
- [x] `ng build` sin errores.
- [x] Login + refresh + historial de ventas + búsqueda de productos funcionando contra Develop.

**Estado: ✅ COMPLETADA**

---

## Fase 1 — Perfil de usuario + sucursal en sesión

> Base de todo lo demás: el backend ahora opera "por sucursal" usando el `Perfil` del usuario autenticado. El frontend debe conocer la sucursal actual.

### 1.1 Domain (feature `auth`)
- [x] `domain/entities/user-profile.entity.ts` (nuevo):
  ```typescript
  export interface UserProfile {
    id: number;
    idUsuario: number;
    idSucursal: number | null;
  }
  ```
- [x] Extender el puerto `AuthRepository` (o crear `ProfileRepository` abstract si se prefiere segregación de interfaz — **recomendado: ISP**):
  ```typescript
  export abstract class ProfileRepository {
    abstract getMyProfile(): Observable<UserProfile>;
    abstract updateMySucursal(idSucursal: number | null): Observable<UserProfile>;
  }
  ```

### 1.2 Application
- [x] `GetMyProfileUseCase` — `GET /api/perfil/`.
- [x] `UpdateMySucursalUseCase` — `PUT /api/perfil/` `{id_sucursal}`.
- [x] `SessionStateService`: agregar signal `currentSucursalId = signal<number | null>(null)`; hidratarlo tras login/restore con `GetMyProfileUseCase`; limpiarlo en logout.
- [x] `AuthFacade`: exponer `sucursalId` (computed) y `refreshProfile()`.

### 1.3 Infrastructure
- [x] `ProfileRepositoryImpl` → `{apiUrl}/perfil/` (GET/PUT). DTO `{id, id_usuario, id_sucursal}` + `ProfileMapper`.
- [x] Registrar provider: `{ provide: ProfileRepository, useClass: ProfileRepositoryImpl }` en `app.config.ts`.

### 1.4 Presentation
- [x] `MainLayoutComponent`: tras login/restore, disparar carga del perfil (vía facade).
- [x] `NavbarComponent`: mostrar badge/chip con la sucursal actual (leer `idSucursal` + catálogo de sucursales para el nombre). Sin edición aquí (eso es Fase 2/6 si aplica).

### Checklist Fase 1
- [x] Entity + puerto + use-cases + impl + mapper creados.
- [x] `SessionStateService` expone `sucursalId` reactivo.
- [x] Navbar muestra la sucursal del usuario logueado.
- [ ] Tests unitarios del use-case y del mapper.

**Estado: ✅ COMPLETADA**

---

## Fase 2 — Re-alineación de Sucursales

### 2.1 Domain
- [x] `branch.entity.ts` — alinear al modelo real:
  ```typescript
  export interface Branch {
    id: number;
    nombreSucursal: string;
    codigoSucursal: string;   // SUC-XXXXXX, solo lectura (auto-generado)
    ubicacion: string;
    codigoPostal: string;
    numeroTelefono: string;
    correoElectronico: string;
  }
  ```
- [x] Actualizar `CreateBranchPayload`/`UpdateBranchPayload` (sin `activa`, sin `codigoSucursal`).

### 2.2 Application / Infrastructure
- [x] DTOs: `BranchResponseDto` (aceptar respuesta mínima `{id, ubicacion}` y completa), `BranchCreateRequestDto`, `BranchUpdateRequestDto` con nombres snake_case del backend (`nombre_sucursal`, `codigo_postal`, `numero_telefono`, `correo_electronico`).
- [x] `BranchMapper` en ambas direcciones.
- [x] ⚠️ **Limitación conocida (NO tocar backend):** el `GET` actual solo devuelve `{id, ubicacion}`. El frontend se adapta a este contrato: el mapper debe tolerar campos ausentes (defaults `''`) y la UI mostrará solo lo disponible. La ampliación del serializer es petición al dev backend (§7, punto 1) — el frontend la consumirá sin cambios cuando llegue, gracias a la tolerancia del mapper.

### 2.3 Presentation
- [x] `BranchFormDialogComponent`: campos `nombreSucursal`, `ubicacion`, `codigoPostal`, `numeroTelefono`, `correoElectronico`. Eliminar toggle `activa`. Mostrar `codigoSucursal` solo en modo edición (readonly).
- [x] `BranchCardComponent`: mostrar código + nombre + ubicación.

### Checklist Fase 2
- [x] CRUD de sucursales funcional contra Develop.
- [x] Build OK + tests del mapper.

**Estado: ✅ COMPLETADA**

---

## Fase 3 — Productos: limpieza + filtros nuevos

### 3.1 Domain
- [x] `product.entity.ts`: **eliminar `existencia` e `idMovimientos`**. Mantener `codigoSat`.
- [x] Nuevo tipo para el flujo por sucursal:
  ```typescript
  export interface ProductStock extends Product {
    cantidad: number;             // stock en la sucursal
    precioSucursal: number | null;
    precioBase: number;
    vigenteDesde: string | null;
    idSucursal: number;
  }
  ```

### 3.2 Application / Infrastructure
- [x] `GetProductsUseCase`: agregar params opcionales `{sucursalId?, search?, clave?, marca?, codigoBarras?, tipoId?, proveedorId?}` → query params del backend.
- [x] DTOs: `ProductResponseDto` sin `existencia`; `ProductStockResponseDto` con los campos enriquecidos; mapper nuevo `ProductStockMapper`.

### 3.3 Búsqueda por código de barras (endpoint dedicado)

El backend expone `GET /api/productos/codigo-barras/?codigo_barras=XXX` (ya implementado y registrado en `producto/urls.py`). Pensado para lector físico de código de barras en el POS.

- [x] **Puerto** — extender `ProductRepository` (feature `inventory`):
  ```typescript
  abstract getByBarcode(codigoBarras: string): Observable<Product | null>;
  ```
- [x] **Use-case** — `GetProductByBarcodeUseCase` (application/usecase): retorna `null` cuando el backend responde 404 (producto no encontrado), propaga error en 400.
- [x] **Implementación** — `product-repository.impl.ts`:
  - `GET {endpoint}/codigo-barras/?codigo_barras=XXX` (el `trailingSlashInterceptor` resuelve la `/` final).
  - Mapear 404 → `null` (no lanzar error de dominio: "no encontrado" es un caso de negocio válido en el POS).
  - Mapear 400 → `ProductFetchError` con el mensaje del backend.
- [x] **Resolución de stock/precio en POS** (el endpoint es global, no por sucursal):
  - Tras obtener el producto por código, buscarlo en el catálogo ya cargado por sucursal (`productos?sucursal_id=`, ver Fase 5) para conocer `cantidad` y `precioSucursal`.
  - Si el producto existe pero no está en el catálogo de la sucursal → significa **stock 0 en esta sucursal** → toast "Producto sin existencias en esta sucursal" y NO agregar al carrito.
  - Si no existe (null) → toast "Producto no registrado".
- [x] **Presentación** — input de código de barras en `sales.page` (lector USB actúa como teclado + Enter):
  - Reusar `SearchInputComponent` con modo "barcode" o un listener `keydown.enter` dedicado.
  - Debounce no necesario (el lector envía el código completo + Enter).
- [x] Tests: use-case (200/404/400) y mapper.

### 3.4 Presentation
- [x] `inventory.page`: eliminar columna "existencia" del catálogo (la existencia vive en Inventario por Sucursal, Fase 4).
- [x] Filtros UI: search + marca + tipo + proveedor (reusar `CategorySliderComponent` y `SearchInputComponent`).
- [x] Formulario de producto: sin cambios (`codigoSat` ya cubierto en plan anterior).

### Checklist Fase 3
- [x] Entidad sin campos muertos; compilación limpia en todos los consumidores (`sales`, `inventory-by-branch`, etc.).
- [x] Búsqueda y filtros funcionando.
- [x] Endpoint de código de barras consumido vía `GetProductByBarcodeUseCase` con manejo 404→null.
- [x] Tests del mapper `ProductStock` y del use-case de barcode.

**Estado: ✅ COMPLETADA**

---

## Fase 4 — Reescritura de Inventario por Sucursal

> El feature existe pero apunta a endpoints inexistentes. Se reescribe infraestructura y se ajusta dominio/presentación al contrato real. **No hay transferencias entre sucursales en el backend → se elimina esa UI.**

### 4.1 Domain
- [x] `inventory.entity.ts` — reescrito como `BranchInventory` + `InventoryItem`
- [x] `inventory-movement.entity.ts` — alineado a `MovimientoInventario{id, tipo: 'ENTRADA'|'SALIDA', cantidad, fecha, razon, observaciones}`. Eliminado `TransferPayload` y tipo `'transferencia'`.
- [x] Puertos: `InventoryRepository` (getMyBranchInventory, getInventarios, createInventario) + `InventoryMovementRepository` (getMovements, registerEntryExit)
- [x] Eliminado `inventory-detail.entity.ts` (reemplazado por `inventory-item.entity.ts`)

### 4.2 Infrastructure
- [x] `inventory-repository.impl.ts` → `GET /api/inventarios/mi-sucursal/` + CRUD `/api/inventarios/`
- [x] `movement-repository.impl.ts` → `GET /api/movimientos-inventario/` + `POST /api/detalles-inventario/bulk/`. Eliminado `transfer()`.
- [x] Mappers nuevos: `InventoryMapper` (snake_case → camelCase, `string` decimal → `number`) + `MovementMapper`
- [x] DTOs nuevos: `BranchInventoryDto`, `InventoryItemDto`, `InventarioRefDto`, `MovementResponseDto`, `RegisterMovementRequestDto`
- [x] Eliminados DTOs obsoletos: `inventory-detail-response.dto`, `movement-create-request.dto`, `transfer-request.dto`

### 4.3 Application
- [x] Use-cases nuevos: `GetMyBranchInventoryUseCase`, `GetInventariosUseCase`, `GetMovementsUseCase`, `RegisterMovementUseCase`
- [x] Facade reescrito: `InventoryByBranchFacade` con signals para inventory, allItems, selectedInventory, movements
- [x] Eliminados use-cases obsoletos: `get-inventory-by-branch`, `get-inventory-detail`, `create-movement`, `transfer-inventory`

### 4.4 Presentation
- [x] `inventory.page`: carga directa `mi-sucursal` (sin selector de sucursal). Empty state si `sucursalId == null`.
- [x] `InventoryTableComponent`: columnas nombre, clave, marca, código de barras, stock (`cantidad`), precio efectivo (badge "Sucursal" si `precioSucursal != null`).
- [x] `MovementFormDialogComponent`: tipo ENTRADA/SALIDA, producto, cantidad, razón, observaciones. Sin transferencia.
- [x] `MovementListComponent`: tipo, cantidad, fecha, razon, observaciones. Sin usuario ni idProducto/idSucursal.
- [x] Eliminado `BranchSelectorComponent` (ya no se necesita).

### Checklist Fase 4
- [x] `ng build` sin errores TypeScript.
- [x] Vista "mi sucursal" funcionando con stock real calculado por el backend.
- [x] Registro de entrada/salida con manejo de errores del backend (toast con mensaje `error` del 400).
- [x] Sin rastros de transferencia ni de endpoints viejos (`/inventario/sucursal/{id}`, `/inventario/movimientos`, `/inventario/transferencia`).
- [x] Mappers y use-cases alineados al contrato real del backend.

**Estado: ✅ COMPLETADA**

---

## Fase 5 — Ventas: integración con inventario y precios por sucursal

### 5.1 Application / Infrastructure
- [x] `CreateSalePayload`: agregar `idInventario: number`. **Quitar `idUsuario`** del request DTO (el backend lo ignora y toma el JWT).
- [x] `SaleMapper.toCreateRequestDto`: emitir `{id_inventario, id_metodoPago}`.
- [x] `Sale` entity/DTO: agregar `idInventario` (response lo incluye).
- [x] Fuente del inventario de la venta: al entrar al POS, resolver `idInventario` a partir del `sucursalId` de sesión (Fase 1) consultando `GET /api/inventarios/mi-sucursal` y tomando `id_inventario`. Guardarlo en `SalesCartService` (signal `ventaInventarioId`).
- [x] Catálogo del POS: cambiar a `GET /api/productos/?sucursal_id={actual}` → los productos ya traen `cantidad` (stock real) y `precio_sucursal`. `SalesProduct.stock = cantidad`; `precio = precioSucursal ?? precioBase`.
- [x] Manejo de errores nuevos en `sale-detail-repository`:
  - 400 "Stock insuficiente…" → toast específico.
  - 400 "…no puede ser operada por el usuario de la sucursal…" → toast de permisos.
  - 400 "no está disponible en el inventario…" → sugerir recargar catálogo.

### 5.2 Presentation
- [x] `sales.page`: si `sucursalId == null` → empty-state "Tu usuario no tiene sucursal asignada" (bloquear venta).
- [x] `ProductCardComponent`: mostrar precio efectivo + badge "Sucursal" si hay precio de sucursal; deshabilitar "agregar" si `stock === 0`.
- [x] `CartPanelComponent` / `QuantityControlComponent`: tope `qty <= stock`.
- [x] Tras `confirmSale()` exitoso: refrescar catálogo (el stock cambió en backend).

### Checklist Fase 5
- [x] Flujo completo: login (con sucursal) → catálogo con stock/precio de sucursal → crear venta → agregar detalles → total correcto → stock decrementado al recargar.
- [x] Errores de stock/sucursal visibles en UI.
- [x] Tests: `SalesCartService` con inventario; mapper de create sin `idUsuario`.

**Estado: ✅ COMPLETADA**

---

## Fase 6 — Feature Clientes (real)

> Sustituye el mock `features/users/presentation/pages/clients`. Estructura estándar del repo:

```
src/app/features/clients/
├── domain/{entities/client.entity.ts, repository/client-repository.ts}
├── application/{dtos/, usecase/, facades/clients.facade.ts}
├── infrastructure/{mappers/client.mapper.ts, repositories/client-repository.impl.ts}
├── presentation/{pages/clients-page/, components/{client-form-dialog/, clients-table/}}
├── clients.routes.ts
└── index.ts
```

- [x] Entidad:
  ```typescript
  export interface Client {
    id: number; idSucursal: number | null;
    nombre: string; apellidoPaterno: string; apellidoMaterno: string | null;
    telefono: string; correo: string | null; direccion: string | null; rfc: string | null;
  }
  ```
- [x] Use-cases: `GetClients`, `CreateClient`, `UpdateClient`, `DeleteClient`.
- [x] Repo → `/api/clientes/` (CRUD estándar, validaciones: `id_sucursal` obligatorio y existente — pre-llenar con la sucursal de sesión).
- [x] Validaciones de formulario: teléfono (≤15), RFC (≤13), correo (email), `apellidoMaterno` opcional.
- [x] Ruta `/clients` + item en sidebar (`roles: ['admin', 'manager', 'seller']`).
- [x] Migrar/eliminar la página mock de `features/users`.

### Checklist Fase 6
- [x] Feature `clients/` creada con arquitectura hexagonal completa.
- [x] Entity, repository, DTOs, mapper, use-cases, facade, página, tabla y formulario.
- [x] Ruta `/clients` integrada en `app.routes.ts` con lazy loading.
- [x] Sidebar actualizado con ítem "Clientes" (roles: admin, manager, seller).
- [x] `id_sucursal` pre-llenado desde la sesión del usuario.
- [x] `ng build` sin errores TypeScript en la feature.

**Estado: ✅ COMPLETADA**

---

## Fase 7 — Precios por Sucursal (admin)

```
src/app/features/branch-pricing/   (misma estructura hexagonal)
```

- [x] Entidad `BranchPrice{id, idProducto, idSucursal, precioVenta, vigenteDesde, activo}`.
- [x] Use-cases: `GetActivePrice` (`/precios-sucursal/activo/`), `GetPriceHistory` (`/historial/`), `SetBranchPrice` (POST — el backend desactiva el anterior solo), `DeactivatePrice`.
- [x] Página (rol `admin`): selector sucursal → tabla de productos con precio base vs precio sucursal → modal para fijar precio (validar > 0) → historial expandible por producto.
- [x] Sidebar: `{ id: 'branch-pricing', label: 'Precios por Sucursal', roles: ['admin'] }`.

**Estado: ✅ COMPLETADA**

---

## Fase 8 — Retiro del feature `movements` huérfano

- [x] Eliminar `src/app/features/movements/` (su endpoint `/movimientos` ya no existe; su página interna "reports" nunca estuvo enrutada — el routing usa `features/reports`).
- [x] Quitar providers/referencias en `app.config.ts` e imports huérfanos.
- [x] `grep -r "features/movements" src/` debe quedar en cero.

> **Nota:** También retirar la página mock de `features/users/presentation/pages/clients/` — ya fue sustituida por la feature real `features/clients/` (Fase 6). Verificar que no queden imports huérfanos de `features/users` fuera del propio módulo.

**Estado: ✅ COMPLETADA**

---

## 4. Tabla de archivos por fase (resumen)

| Fase | Crea | Modifica | Elimina |
|------|------|----------|---------|
| 0 | — | `auth-endpoints.ts`, `sale-endpoints.ts`, `product-repository.impl.ts` | — |
| 1 | entity/puerto/use-cases/impl/mapper de perfil | `session-state.service.ts`, `auth.facade.ts`, `app.config.ts`, `navbar/*`, `main-layout/*` | — |
| 2 | DTOs nuevos de sucursal | `branch.entity.ts`, `branch.mapper.ts`, form/card de branches | — |
| 3 | `product-stock.entity.ts`, mapper, use-cases de filtro + `GetProductByBarcodeUseCase` | `product.entity.ts`, `product-repository.impl.ts` (search + barcode), `inventory.page.*`, `sales.page.*` (input barcode) | campos `existencia`, `idMovimientos` |
| 4 | mappers/use-cases nuevos de inventario | todo `inventory-by-branch/**` | transferencia (UI + repo) |
| 5 | — | `sale*.{ts}`, `sales-cart.service.ts`, componentes POS | `idUsuario` del request |
| 6 | feature `clients/` completo | `app.routes.ts`, `app-routes.ts`, `sidebar-menu.defaults.ts`, `features/index.ts` | mock clients en `features/users` |
| 7 | feature `branch-pricing/` completo | routing/sidebar/config | — |
| 8 | — | `app.config.ts` | `features/movements/` |

---

## 5. Consideraciones de Arquitectura (recordatorio)

- **Capas:** Domain (sin dependencias) ← Application ← Infrastructure / Presentation. Los componentes solo hablan con **Facades**; los facades orquestan **use-cases**; la HTTP vive solo en `infrastructure/repositories`.
- **SOLID:** puertos como `abstract class` (DIP), un use-case = una responsabilidad (SRP), payloads/entidades segregadas por caso de uso (ISP).
- **DI:** providers de repositorio en `app.config.ts` (globales) o en `*.routes.ts` (scoped al feature lazy).
- **Estado:** signals + `computed`, `OnPush`, sin lógica en templates.
- **Errores:** errores de dominio tipados por feature (`*.errors.ts`) + `resolveHttpErrorMessage`; los mensajes `error` del backend (400) se muestran al usuario vía `ToastService`.
- **Convención backend:** el `trailingSlashInterceptor` ya asegura `/` final — los endpoints nuevos deben declararse sin `/` final en las constantes.
- **Testing:** Jest por capa (mapper, use-case, facade) siguiendo los specs existentes.

---

## 6. Riesgos y decisiones

| Riesgo | Mitigación |
|--------|------------|
| `GET /sucursales/` solo devuelve `{id, ubicacion}` | Solicitar al backend ampliar `SucursalService._to_dict` (cambio de 5 líneas) o la UI trabaja con el contrato mínimo. |
| No hay endpoint de transferencia entre sucursales | Se elimina la UI de transferencia. Si el negocio lo requiere, se levanta requerimiento al backend (SALIDA en origen + ENTRADA en destino). |
| `mi-sucursal` requiere perfil con sucursal; admin sin sucursal recibe 400 | Flujo admin usa `productos?sucursal_id=`; el facade decide la estrategia según sesión. |
| Ventas viejas sin `id_inventario` | El backend usa `SET_NULL`; el historial debe tolerar `id_inventario: null`. |
| Notifications sin exponer en backend | Feature frontend ya listo (Fase 3 anterior). No tocar hasta que `RTR/urls.py` la registre. |

---

## 7. Peticiones sugeridas al Backend (NOTIFICAR al dev backend — NO las hace el frontend)

> Todo lo que sigue es **responsabilidad del backend**. El frontend se adapta al contrato actual; estos puntos son mejoras/correcciones que deben notificarse al dev backend:

1. **Ampliar `SucursalService._to_dict`** (`sucursales/services/sucursal_service.py`): hoy solo devuelve `{id, ubicacion}`. Debería exponer `nombre_sucursal`, `codigo_sucursal`, `codigo_postal`, `numero_telefono`, `correo_electronico` para que el CRUD de sucursales del frontend pueda mostrar los campos que el modelo ya persiste.
2. **`GET /api/productos/codigo-barras/` no incluye `codigoSAT` ni datos de sucursal**: el `_to_dict` de `ProductoService` omite `codigoSAT` en la respuesta (aunque el campo existe en el modelo). Además, para el POS sería ideal que aceptara un `sucursal_id` opcional y enriqueciera con `cantidad` (stock) y `precio_sucursal`, igual que hace `GET /productos/?sucursal_id=`. Mientras tanto, el frontend cruza el resultado con el catálogo por sucursal (Fase 3.3).
3. **Endpoint de stock por sucursal explícito para admins**: hoy solo existe `GET /inventarios/mi-sucursal/` (usa el perfil del JWT). Un admin sin sucursal asignada recibe 400. Se sugiere `GET /inventarios/por-sucursal/?sucursal_id=` (o permitir `?sucursal_id=` en el actual) para consulta administrativa.
4. **Filtro por sucursal/inventario en `GET /api/movimientos-inventario/`**: actualmente devuelve todos los movimientos globales sin filtros. Se sugiere soportar `?sucursal_id=` o `?inventario_id=`, `?tipo=`, `?fecha_desde=`, `?fecha_hasta=`.
5. **Registrar la app `notifications` en `RTR/urls.py`**: el código y las migraciones existen pero no hay `path('api/', include('notifications.urls'))`, por lo que los endpoints no están expuestos. El feature de notificaciones del frontend (ya construido) queda en espera hasta que se publique.
6. **Endpoint de transferencia atómica entre sucursales** (si el negocio lo requiere): SALIDA en origen + ENTRADA en destino en una sola transacción. El frontend eliminó la UI de transferencias porque el endpoint no existe.
7. **Verificar contrato del refresh token**: el backend expone `POST /api/token/refresh` (SimpleJWT estándar). El frontend apuntaba a `/refresh`; se corrige en Fase 0, pero confirmar que el body `{refresh}` → `{access}` es el esperado.
8. **`search` del `ProductoRepository.search()` no incluye `codigo_barras` ni `descripcion`**, pero `ProductoService.get_all(search=...)` sí los busca vía queryset propio. El método `search()` del repositorio quedó desincronizado (parece código muerto, pero conviene revisarlo para consistencia).
