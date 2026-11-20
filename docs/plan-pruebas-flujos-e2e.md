# Plan de pruebas E2E de flujos — backend local

> Objetivo: probar **todos los flujos de la app, módulo por módulo**, con Playwright contra el
> backend **local** (`../RefaccionariaBack`, Django, `http://127.0.0.1:8000`), sin mocks salvo
> donde el backend real no permite provocar el caso.
>
> Relación con otros planes: [plan-pruebas.md](plan-pruebas.md) (plan maestro),
> [plan-pruebas-admin-auth-ventas.md](plan-pruebas-admin-auth-ventas.md) (unitarias, integración y
> E2E con mocks de auth, ventas y admin). Este documento cubre solo **E2E contra backend real**.

---

## 0. Motivo y forma de trabajo

### 0.1 Motivo

Se detectaron errores en los módulos de **productos** (inventario) y **sucursales**. Este plan:

1. Valida con regresión que **el resto de la app** funciona (fases F1–F5).
2. Prueba productos y sucursales **al final** (fase F6): otro equipo está corrigiendo esos errores;
   así las pruebas corren sobre su versión ya corregida y no se pisan cambios.

### 0.2 Paso 0 de cada fase: sincronizar con el remoto

Antes de empezar cada fase:

| Repo | Comandos |
|---|---|
| FrontTRT | `git fetch origin` → `git log --oneline master..origin/master` (`master` no tiene upstream configurado) |
| RefaccionariaBack | `git -C ../RefaccionariaBack fetch origin` → `git -C ../RefaccionariaBack log --oneline Develop..origin/Develop` |

- Sin cambios → seguir.
- Con cambios y sin conflicto → `git pull --ff-only origin <rama>`, revisar qué archivos tocan y ajustar la fase si afectan sus módulos.
- Con cambios locales que choquen, o si no se puede hacer fast-forward → parar y decidir con el responsable. No se hace merge automático.

### 0.3 Coordinación

- Cada fase la ejecuta un **subagente (modelo Sonnet)**; el coordinador hace el paso 0, le da el
  brief, revisa el diff, corre la fase y llena el registro de avance.
- Los subagentes responden en modo caveman y usan `graphify query/path/explain` antes de buscar en el
  código crudo; al terminar corren `graphify update .`.
- No se avanza de fase sin verificar el resultado y sin el visto bueno del responsable.

### 0.4 Regla para bugs encontrados

Bug en la **lógica del backend** (controllers, services, repositories, models, serializers,
migraciones) → no se corrige aquí (no es responsabilidad de este equipo): se registra en §7.1 con
síntoma, request/response y causa probable, se notifica al responsable del backend y la prueba queda
en `test.fixme` con el ID del hallazgo. En el back **sí** se permiten cambios de pruebas y
configuración (semilla `seed_e2e`, tests, settings de entorno, `.gitignore`).

Bug en **productos o sucursales** antes de F6 → solo se registra y se avisa al otro equipo; no se toca
ese código.

Cualquier otro bug del **frontend** (no de la prueba) → **TDD**: prueba que falla y lo reproduce → corrección mínima en el
front o el back, donde esté la causa → prueba en verde → registro del hallazgo (§7). Si la corrección
es grande, se registra y se decide antes de tocar código.

---

## 1. Ambiente

### 1.1 Piezas

| Pieza | Valor |
|---|---|
| Backend | `../RefaccionariaBack` → `python manage.py runserver 127.0.0.1:8000` |
| Base de datos | `db.e2e.sqlite3`, **copia** de la base semilla; nunca la `db.sqlite3` de desarrollo |
| Frontend | `ng serve --configuration local --port 5173` |
| Variables | `E2E_REAL=1`, `API_BASE=http://127.0.0.1:8000`, `BASE_URL=http://localhost:5173`, `E2E_DB=<ruta a db.e2e.sqlite3>` |
| Helpers existentes | `e2e/helpers/backend.ts` (`API_BASE`, `IS_LOCAL_API`, `wakeBackend`), `e2e/fixtures/test-users.ts` |
| Spec de referencia | `e2e/sales.real.spec.ts` (estilo, verificación en BD con `sqlite3`) |
| Herramientas del sistema | `sqlite3` (verificación en BD) y `pdftotext` de `poppler-utils` (los reportes son PDF) |

### 1.2 Datos semilla

La corrida necesita, como mínimo:

- **Sucursales**: Centro (1), Norte (2), Sur (3).
- **Usuarios** de `e2e/fixtures/test-users.ts`: `admin.e2e` (admin), `gerente.general` (manager),
  `ana.centro` / `maria.norte` / `luis.sur` (cajeros), `vendedor1` y `admin_neon` (sin sucursal).
- **Métodos de pago**: Efectivo y Tarjeta (endpoint `metodopago/`).
- **Productos E2E** con clave `E2E-*`, stock en cada sucursal y precio base; al menos uno con
  precio propio de sucursal (hoy `Balata E2E`, `E2E-001`, $120 en Centro).
- Un producto con stock **justo arriba del umbral de stock bajo**, para probar notificaciones.

**Decisión pendiente (D-1)**: cómo se carga la semilla.

| Opción | Pro | Contra |
|---|---|---|
| **A. Comando `manage.py seed_e2e`** (recomendada) | Repetible, versionado, se corre sobre una BD vacía migrada | Cambio en el backend |
| B. Copiar una `db.sqlite3` ya preparada | Sin tocar el backend | Binario sin historial; se desactualiza con cada migración |

### 1.3 Reset y ejecución

1. `cp db.sqlite3 db.e2e.sqlite3` (opción B) o `migrate` + `seed_e2e` sobre `db.e2e.sqlite3` (opción A).
2. Levantar el backend apuntando a `db.e2e.sqlite3`.
3. `npm run e2e:flujos` (script nuevo): levanta el front, espera `/login` y corre `e2e/flujos/**`.

Reglas:

- SQLite no tolera bien escrituras concurrentes: **`workers: 1`** para `e2e/flujos/**`.
- Cada prueba crea sus propios datos con nombre único (`E2E <módulo> <timestamp>`) y no depende
  del orden de otras pruebas, salvo la cadena de la sección 5, que es serial a propósito.
- Lo que una prueba crea se limpia al final (`afterEach` vía API) o se descarta con el reset de la BD.
- Las verificaciones van en dos niveles: **UI** (lo que ve el usuario) y **API/BD** (lo que quedó
  guardado: stock, venta, método de pago).

---

## 2. Actores

| Rol | Usuario | Sucursal | Puede |
|---|---|---|---|
| admin | `admin.e2e` | Centro | Todo: sucursales, usuarios, precios, inventario por sucursal, gerente |
| manager | `gerente.general` | Centro | Gerente (cajeros), inventario por sucursal, módulos comunes |
| cajero | `ana.centro`, `maria.norte`, `luis.sur` | 1 / 2 / 3 | Ventas, historial, inventario, clientes, proveedores, reportes, notificaciones |
| sin sucursal | `vendedor1`, `admin_neon` | — | Entra, pero el POS muestra el estado vacío |

Rutas con `roleGuard` (ver `src/app/app.routes.ts`):

| Ruta | Roles |
|---|---|
| `branches`, `admin`, `branchPricing` | admin |
| `manager`, `inventoryByBranch`, `reports` | admin, manager (reportes: el back da 403 al cajero, H-F4-3) |
| `sales`, `inventory`, `history`, `suppliers`, `clients`, `notifications` | cualquier usuario autenticado |

Cada flujo se prueba con **los roles que deben poder hacerlo** y con **uno que no debe**.

---

## 3. Casos por módulo

Convención de IDs: `FLU-<MÓDULO>-<NNN>`. Cada módulo cubre cuatro tipos de caso:
**feliz**, **validación** (el front no envía nada inválido), **rechazo** (el backend responde 4xx y el
front muestra su mensaje) y **permiso** (rol sin acceso).

### 3.1 Auth — `FLU-AUT`

| ID | Caso | Tipo |
|---|---|---|
| FLU-AUT-001 | Login de cada rol (admin, manager, cajero) llega a `/sales` y el sidebar muestra solo sus opciones | feliz |
| FLU-AUT-002 | Credenciales inválidas: se queda en `/login` con el mensaje del backend | rechazo |
| FLU-AUT-003 | Campos vacíos no llaman al backend | validación |
| FLU-AUT-004 | "Recordar sesión": recargar conserva la sesión; sin recordar, se pierde | feliz |
| FLU-AUT-005 | Access token vencido: el refresh real renueva y la petición se reintenta | feliz |
| FLU-AUT-006 | Logout limpia el almacenamiento y bloquea las rutas privadas | feliz |
| FLU-AUT-007 | Usuario sin sucursal ve el estado vacío del POS | permiso |

### 3.2 Ventas (POS) — `FLU-VEN`

**Matriz principal**: cada cajero (Centro, Norte, Sur) × cada método de pago. Los métodos se leen de
`GET metodopago/` al inicio de la suite, así un método nuevo entra solo a la matriz.

Por cada combinación, `FLU-VEN-001`:

1. Login del cajero.
2. Agregar producto A y producto B; subir A a 2 unidades.
3. Eliminar B del carrito; bajar A a 1 y volver a 2.
4. Elegir el método de pago y procesar.
5. Verificar: ticket = total del carrito, la venta existe en el backend con **ese método**, el
   stock de A bajó 2 en **esa sucursal** y no en las otras.

| ID | Caso | Tipo |
|---|---|---|
| FLU-VEN-001 | Matriz cajero × método de pago (arriba) | feliz |
| FLU-VEN-002 | Búsqueda filtra el catálogo y agrega al carrito | feliz |
| FLU-VEN-003 | Código de barras + Enter agrega; uno desconocido avisa | feliz / validación |
| FLU-VEN-004 | El carrito se topa en el stock disponible | validación |
| FLU-VEN-005 | Producto sin existencias no se puede agregar | validación |
| FLU-VEN-006 | Carrito vacío o sin método de pago no se puede procesar | validación |
| FLU-VEN-007 | Subtotal, IVA 16 % y total coinciden con el total que guarda el backend | feliz |
| FLU-VEN-008 | Sucursal con precio propio cobra ese precio; las demás cobran el base | feliz |
| FLU-VEN-009 | Dos cajeros de la misma sucursal venden el último stock: el segundo recibe el rechazo y su carrito se conserva | rechazo |
| FLU-VEN-010 | Ticket de una venta se puede volver a abrir | feliz |

### 3.3 Historial de ventas — `FLU-HIS`

| ID | Caso | Tipo |
|---|---|---|
| FLU-HIS-001 | La venta recién hecha aparece con folio, total, método de pago y cajero | feliz |
| FLU-HIS-002 | Filtros (fecha, método, sucursal si aplica) reducen la lista correctamente | feliz |
| FLU-HIS-003 | Abrir el detalle / ticket desde el historial | feliz |
| FLU-HIS-004 | Un cajero ve solo las ventas de su sucursal | permiso |

### 3.4 Inventario (productos y tipos) — `FLU-INV`

| ID | Caso | Tipo |
|---|---|---|
| FLU-INV-001 | Crear producto, editarlo y eliminarlo; la lista refleja cada cambio | feliz |
| FLU-INV-002 | Búsqueda por nombre, filtro por categoría y búsqueda por código de barras | feliz |
| FLU-INV-003 | Crear, editar y eliminar un tipo de producto | feliz |
| FLU-INV-004 | Formulario incompleto o con datos inválidos no se envía | validación |
| FLU-INV-005 | Clave o código de barras duplicado muestra el mensaje del backend | rechazo |
| FLU-INV-006 | Producto nuevo aparece en el catálogo del POS | feliz |

### 3.5 Inventario por sucursal — `FLU-IXS`

| ID | Caso | Tipo |
|---|---|---|
| FLU-IXS-001 | Ver el inventario de la propia sucursal | feliz |
| FLU-IXS-002 | Registrar entrada: el stock sube y el POS de esa sucursal lo refleja | feliz |
| FLU-IXS-003 | Registrar salida: el stock baja | feliz |
| FLU-IXS-004 | Salida mayor al stock es rechazada y el stock no cambia | rechazo |
| FLU-IXS-005 | El historial de movimientos muestra la entrada y la salida con usuario y fecha | feliz |
| FLU-IXS-006 | Cajero no entra a la ruta; manager y admin sí | permiso |

### 3.6 Precios por sucursal — `FLU-PRE`

| ID | Caso | Tipo |
|---|---|---|
| FLU-PRE-001 | Fijar precio en Norte; Norte lo muestra y Centro conserva el suyo | feliz |
| FLU-PRE-002 | Desactivar el precio: el POS vuelve al precio base | feliz |
| FLU-PRE-003 | Historial de precios muestra cada cambio | feliz |
| FLU-PRE-004 | Precio 0 o negativo no se puede fijar | validación |
| FLU-PRE-005 | El POS de Norte cobra el precio nuevo en una venta real | feliz |
| FLU-PRE-006 | Manager y cajero no entran a la ruta | permiso |

### 3.7 Clientes — `FLU-CLI`

| ID | Caso | Tipo |
|---|---|---|
| FLU-CLI-001 | Crear, editar y eliminar un cliente | feliz |
| FLU-CLI-002 | Cancelar la eliminación no borra | feliz |
| FLU-CLI-003 | Campos obligatorios y formatos (correo, teléfono, RFC si aplica) | validación |
| FLU-CLI-004 | Duplicado rechazado por el backend muestra su mensaje | rechazo |
| FLU-CLI-005 | Búsqueda / paginación de la lista | feliz |

### 3.8 Proveedores — `FLU-PRO`

| ID | Caso | Tipo |
|---|---|---|
| FLU-PRO-001 | Crear, editar y eliminar un proveedor | feliz |
| FLU-PRO-002 | Cancelar la eliminación no borra | feliz |
| FLU-PRO-003 | Validaciones del formulario | validación |
| FLU-PRO-004 | Duplicado rechazado por el backend muestra su mensaje | rechazo |

### 3.9 Sucursales — `FLU-SUC`

| ID | Caso | Tipo |
|---|---|---|
| FLU-SUC-001 | Admin crea, edita y elimina una sucursal | feliz |
| FLU-SUC-002 | Cancelar la eliminación no borra | feliz |
| FLU-SUC-003 | Nombre corto o campos vacíos no se envían | validación |
| FLU-SUC-004 | Nombre duplicado muestra el mensaje del backend | rechazo |
| FLU-SUC-005 | Manager y cajero no entran a la ruta | permiso |

### 3.10 Usuarios / Admin — `FLU-USR`

| ID | Caso | Tipo |
|---|---|---|
| FLU-USR-001 | Admin crea un cajero con rol y sucursal; **ese usuario hace login y vende** | feliz |
| FLU-USR-002 | Editar rol o sucursal de un usuario cambia lo que ve al entrar | feliz |
| FLU-USR-003 | Eliminar un usuario: ya no puede hacer login | feliz |
| FLU-USR-004 | Formulario incompleto no envía nada | validación |
| FLU-USR-005 | Usuario o correo duplicado muestra el mensaje del backend | rechazo |
| FLU-USR-006 | El resumen de `/admin` cuadra con sucursales y usuarios existentes | feliz |

### 3.11 Gerente — `FLU-GER`

| ID | Caso | Tipo |
|---|---|---|
| FLU-GER-001 | Manager ve los cajeros de su sucursal y no los de otras | permiso |
| FLU-GER-002 | Manager da de alta / edita / da de baja un cajero de su sucursal | feliz |
| FLU-GER-003 | El cajero creado por el manager entra y vende en esa sucursal | feliz |
| FLU-GER-004 | Cajero no entra a la ruta | permiso |

### 3.12 Reportes — `FLU-REP`

Tipos: `day`, `week`, `quincena` (1 y 2), `month`, `year` (ver `report-params.model.ts`, endpoint `reporte/`).

| ID | Caso | Tipo |
|---|---|---|
| FLU-REP-001 | Reporte del día: el total incluye las ventas creadas en la corrida (antes vs. después) | feliz |
| FLU-REP-002 | Cada tipo de reporte carga sin error y muestra el periodo correcto | feliz |
| FLU-REP-003 | Desglose por método de pago cuadra con las ventas de la matriz FLU-VEN-001 | feliz |
| FLU-REP-004 | Periodo sin ventas muestra el estado vacío | feliz |

### 3.13 Notificaciones — `FLU-NOT`

En el backend las crea `notifications/services/stock_alerts.py` después de cada movimiento de stock:
`LOW_STOCK` si `0 < stock < umbral`, `OUT_OF_STOCK` si `stock == 0`, y se resuelven solas cuando el
stock se recupera.

| ID | Caso | Tipo |
|---|---|---|
| FLU-NOT-001 | Vender hasta dejar el producto bajo el umbral genera `LOW_STOCK` | feliz |
| FLU-NOT-002 | Vender hasta 0 cambia la alerta a `OUT_OF_STOCK` | feliz |
| FLU-NOT-003 | Una entrada de inventario que recupera el stock resuelve la alerta | feliz |
| FLU-NOT-004 | Marcar una como leída, marcar todas y eliminar | feliz |
| FLU-NOT-005 | Cada usuario ve solo las notificaciones que le corresponden | permiso |

### 3.14 Permisos — `FLU-PER`

| ID | Caso | Tipo |
|---|---|---|
| FLU-PER-001 | Cada ruta × cada rol con backend real: entra o vuelve a `/sales` según la tabla de la sección 2 | permiso |
| FLU-PER-002 | Sin sesión, cualquier ruta privada manda a `/login` con `redirectTo` | permiso |
| FLU-PER-003 | El menú de cada rol coincide exactamente con las rutas a las que puede entrar | permiso |

`e2e/admin.access.spec.ts` ya cubre esto con mocks; aquí se repite con login real para confirmar
que el rol que deduce el backend coincide con lo que espera el front.

---

## 4. Lo que se queda con mocks

| Caso | Por qué |
|---|---|
| Errores 500, timeouts, backend caído | No se pueden provocar a voluntad con el backend real; ya están en `e2e/*.spec.ts` con `page.route` |
| Impresión del ticket (Electron / `DesktopPort`) | Desde el navegador no hay impresora; se revisa a mano en la app de escritorio |

---

## 5. Cadena "día completo" — `FLU-DIA` (`@smoke`)

Prueba serial que confirma que los módulos funcionan **juntos**:

1. Admin crea una sucursal, un producto con stock en ella y un precio de sucursal.
2. Admin crea un cajero para esa sucursal.
3. El cajero entra, vende con **Efectivo** y con **Tarjeta**, eliminando un artículo del carrito en una de ellas.
4. Verificar: stock descontado, las dos ventas en el historial con su método, reporte del día con ese total.
5. El cajero vende hasta dejar el producto bajo el umbral: aparece la notificación `LOW_STOCK`.
6. Manager registra una entrada de inventario: la alerta se resuelve.

Se corre primero en cada corrida (`--grep @smoke`); si falla, el resto de la suite no aporta.

---

## 6. Estructura de archivos

```
e2e/
  flujos/
    dia-completo.real.spec.ts        # FLU-DIA (@smoke)
    auth.real.spec.ts                # FLU-AUT
    ventas.real.spec.ts              # FLU-VEN
    historial.real.spec.ts           # FLU-HIS
    inventario.real.spec.ts          # FLU-INV
    inventario-sucursal.real.spec.ts # FLU-IXS
    precios.real.spec.ts             # FLU-PRE
    clientes.real.spec.ts            # FLU-CLI
    proveedores.real.spec.ts         # FLU-PRO
    sucursales.real.spec.ts          # FLU-SUC
    usuarios.real.spec.ts            # FLU-USR
    gerente.real.spec.ts             # FLU-GER
    reportes.real.spec.ts            # FLU-REP
    notificaciones.real.spec.ts      # FLU-NOT
    permisos.real.spec.ts            # FLU-PER
  helpers/
    backend.ts                       # existente
    api.ts                           # login por API y alta/baja de datos de prueba
    pages/                           # acciones por pantalla: login, pos, crud, reportes
  fixtures/
    test-users.ts                    # existente
```

Reglas de los specs:

- `test.skip(!REAL, ...)` como en `sales.real.spec.ts`, para que `npm run e2e` normal no los corra.
- Login por **UI** solo en `FLU-AUT` y `FLU-DIA`; el resto entra por API y guarda la sesión
  (`storageState` por rol) para ahorrar tiempo.
- Selectores por rol y texto visible (`getByRole`, `getByLabel`); nada de clases CSS.
- Un caso = un `test()` con su ID en el título, para trazarlo en el reporte.

---

## 7. Fases

Cada fase empieza con el paso 0 (§0.2).

| Fase | Contenido | Hecho cuando |
|---|---|---|
| F0 | Ambiente: semilla (D-1), `db.e2e.sqlite3`, script `e2e:flujos`, `helpers/api.ts`, `storageState` por rol | `FLU-AUT-001` pasa con los tres roles |
| F1 | Auth + Ventas (matriz de pagos) + Historial | `FLU-AUT`, `FLU-VEN`, `FLU-HIS` en verde |
| F2 | Inventario por sucursal, precios | `FLU-IXS`, `FLU-PRE` en verde |
| F3 | Clientes, proveedores, usuarios | `FLU-CLI`, `FLU-PRO`, `FLU-USR` en verde |
| F4 | Gerente, reportes, notificaciones | `FLU-GER`, `FLU-REP`, `FLU-NOT` en verde |
| F5 | Permisos | `FLU-PER` en verde |
| F6 | **Productos y sucursales** (tras la corrección del otro equipo) + cadena "día completo" + evidencia | `FLU-INV`, `FLU-SUC`, `FLU-DIA` en verde; reporte HTML guardado; tabla de avance llena |

Un fallo que sea **bug de la app** (no de la prueba) sigue la regla de §0.4 y se registra en §7.1
con el formato de [plan-pruebas-admin-auth-ventas.md](plan-pruebas-admin-auth-ventas.md) §5.

### 7.1 Registro de hallazgos

| ID | Fase | Caso | Módulo | Severidad | Descripción | Causa | Corrección | Estado |
|---|---|---|---|---|---|---|---|---|
| H-F0-1 | F0 | — | Back / config | Media | Con `DATABASE_URL=sqlite:///…` el back no arranca: `Connection() got unexpected keyword 'sslmode'` | `RTR/settings.py` exige SSL salvo host localhost/127.0.0.1 | `_il_host` también es verdadero si la URL empieza con `sqlite`; Postgres sin cambio | Corregido |
| H-F0-2 | F0 | — | Front / config E2E | Baja | `playwright.config.ts` levantaba un `ng serve` extra en 4200 aunque el script ya sirve en 5173 | `webServer` sin condición | `webServer` solo si no hay `BASE_URL` | Corregido |
| H-F0-3 | F0 | — | Back / migraciones | Alta (local) | `producto/migrations/0003_rename_codigosat_producto_codigo_sat.py` sin seguimiento rompía todo `manage.py` (`NodeNotFoundError`: el padre `0002_producto_codigosat` no existe) | Archivo viejo local, no está en el remoto | Movido a `RefaccionariaBack/.e2e-backup/` | Corregido (local) |
| H-F1-1 | F1 | FLU-VEN-010, FLU-HIS-* | Front / historial | Alta | El cajero abre `/history` → `GET /users` da 403 → el interceptor lo manda a `/forbidden` y termina en `/login` | `GetSalesHistoryUseCase` siempre pedía `/users` (el back solo lo permite a manager/admin) | Si el rol es `seller` no pide `/users` y rotula con su propio usuario (TDD: E2E + jest) | Corregido |
| H-F1-2 | F1 | FLU-HIS-001 | **Back** / ventas | Media | El cajero ve a los demás cajeros de su sucursal como "Usuario Desconocido" en el historial | `venta_to_dict` (`ventas/services/venta_query.py`) no incluye el nombre del cajero y `/users` es 403 para cajeros | Propuesta para el equipo del back: agregar `usuario_nombre` a la respuesta de ventas | **Reportado al back** |
| H-F2-1 | F2 | FLU-IXS-001..005 | Front / inventario por sucursal | Alta | `/inventory-by-branch` queda vacío al recargar o entrar directo por URL | `ngOnInit` leía `sucursalId()` antes de que llegara el perfil (asíncrono) y no volvía a cargar | `effect` que carga inventario y movimientos cuando aparece la sucursal (TDD: E2E + jest) | Corregido |
| H-F2-2 | F2 | FLU-IXS-002..005 | Front / inventario por sucursal | Alta | Registrar entrada o salida responde 400 `Faltan campos obligatorios: id_sucursal`: no se podía mover inventario | El front solo mandaba `id_inventario`; el back trabaja por sucursal | Se envía `id_sucursal` (entidad, DTO, mapper y página) (TDD: E2E + jest) | Corregido |
| H-F3-1 | F3 | FLU-CLI-001 | Front / clientes | Alta | Crear o editar un cliente sin apellido materno, dirección o RFC → 400 `NOT NULL constraint failed: clientes_cliente.apellido_materno` | El front mandaba `null` en campos que el back define como texto obligatorio | `ClientMapper` manda `''` en esos 3 campos (TDD: E2E + jest) | Corregido |
| H-F3-2 | F3 | FLU-CLI-004b, FLU-PRO-004b | Front / clientes y proveedores | Alta | El cajero ve Editar/Eliminar; al usarlos el back da 403 y la app lo saca a `/login` | La UI no ocultaba acciones que el back reserva a encargado/admin | Input `canManage` en tablas; el cajero solo crea y consulta (TDD: E2E + jest) | Corregido |
| H-F3-3 | F3 | FLU-PRO-003 | Front / proveedores | Media | Los errores del back se mostraban como `Http failure response…` | `resolveErrorMessage` no leía `{"error": …}` | Lo lee (TDD: jest) | Corregido |
| H-F3-4 | F3 | FLU-USR-003b | **Back** / usuarios | Alta | Un usuario desactivado (`is_active=false`) puede hacer login: `POST /api/login` → 200 con tokens | `UserService.login` no revisa `is_active` (`usuario/services/usuario_service.py`) | Esperado 401 | Corregido por el back (`09e1fe7`); prueba activa |
| H-F3-5 | F3 | FLU-USR-005b | **Back** / usuarios | Media | Se acepta un correo duplicado: `POST /api/users` → 201 | `User.email` no es único y `create_user` no lo valida (`usuario/services/usuario_service.py`) | Esperado 400 | Corregido por el back (`09e1fe7`); prueba activa |
| H-F4-1 | F4 | FLU-GER-001b, FLU-GER-002b | Front / gerente | Alta | `/manager` (gestión de cajeros) es una maqueta: 3 cajeros fijos y un formulario que no guarda nada | Pantalla sin conectar a facade/repositorio | Funcionalidad sin construir, no un bug puntual. Cubierto por API (GER-001/002); UI en `test.fixme`. **Decisión: se construye como tarea aparte al terminar F6** | Abierto (planeado) |
| H-F4-2 | F4 | FLU-REP-006 | **Back** / reportes | Media | El reporte del gerente de Centro incluye ventas de Norte (`GET /api/reporte/?tipo=day`) | `ReporteVentaService` / `VentaRepository.get_ventas_por_rango` no filtran por sucursal del usuario (`ventas/services/reporte_venta_service.py`, `ventas/repositories/venta_repository.py`, `ventas/views/reporte_venta_view.py`) | Confirmar regla con negocio; el resto de módulos limita al encargado a su sucursal. Prueba en `test.fixme` | **Reportado al back** |
| H-F4-3 | F4 | FLU-REP-005 | Front / reportes | Media | El cajero ve "Reportes" en el menú y entra a `/reports`, pero el back responde 403 | Ruta y sidebar sin restricción de rol | Ruta y menú solo para admin/manager (TDD: E2E + jest) | Corregido |
| H-F4-4 | F4 | FLU-NOT-003b | **Back** / notificaciones | Media | Las alertas ya resueltas siguen listadas: tras reponer stock el usuario sigue viendo "quedan 9 unidades", y al llegar a 0 ve juntas la de stock bajo (resuelta) y la de agotado | `NotificationRepository.list_for_user` no filtra `resuelta_en` y `NotificationService._to_dict` no lo expone (`notifications/repositories/notification_repository.py`, `notifications/services/notification_service.py`) | Prueba en `test.fixme` | **Reportado al back** |
| H-F6-1 | F6 | FLU-INV-001b, 005b | Front / productos | Alta | Crear producto por UI siempre da 400 (`Faltan campos obligatorios: id_proveedor`; luego `NOT NULL … descripcion/codigoSAT`) | El formulario no tiene campo proveedor y `normalizeOptionalString` (`product-form-dialog.component.ts:75`) manda `null` en textos vacíos | Propuesto: select de proveedor y `''` en vez de `null` (también `product.mapper.ts`) | Abierto (no aplicado, módulo del otro equipo) |
| H-F6-2 | F6 | FLU-INV-001c, 001d | Front / productos | **Crítica** | Editar, eliminar y fijar precio usan el id de la fila de stock en vez del id del producto: pueden editar o **borrar otro producto** | `inventory.page.ts:189, :212, :237` → `(product as any).id ?? idProducto`; en `InventoryItem`, `id` es la fila de stock | Propuesto: usar siempre `idProducto` | Abierto (no aplicado) |
| H-F6-3 | F6 | FLU-INV-001c | Front / productos | Alta | El diálogo de editar abre sin categoría, proveedor, descripción ni SAT y el PUT los borra | `toProduct()` (`inventory.page.ts:261-270`) los pone en `null`; `mi-sucursal` no los trae | Propuesto: cargar `GET /productos/{idProducto}/` antes de abrir el diálogo | Abierto (no aplicado) |
| H-F6-4 | F6 | FLU-INV-001g | Front / productos | Alta | El cajero ve Editar/Precio/Eliminar; el back responde 403 y lo saca a `/login` | `inventory-product-card.component.html` no mira el rol (igual que H-F3-2) | Propuesto: input `canManage` (solo encargado/admin) | Abierto (no aplicado) |
| H-F6-5 | F6 | FLU-INV-002b | Front / productos | Media | El filtro de categoría no filtra | `inventory.page.ts:81` hace `void catId`; `mi-sucursal` no trae `id_tipo` | Propuesto: que el back agregue `id_tipo` a `mi-sucursal` o cruzar con `GET /productos/?tipo_id=` | Abierto (no aplicado) |
| H-F6-11 | F6 | FLU-INV-004c | Front / productos | Media | En pantallas de ~768 px de alto los botones Crear/Cancelar del diálogo quedan fuera de vista | `product-form-dialog.component.css:4,17` quitó `max-height` y `overflow-y` | Propuesto: `:host { max-height: 90vh; overflow-y: auto; }` | Abierto (no aplicado) |
| H-F6-12 | F6 | FLU-INV-005b | Front / productos | Alta | Los errores del back en productos nunca se muestran (consola `NG0600`) | 4 `effect` de error en `inventory.page.ts:96-115` sin `allowSignalWrites`; `inventory.facade.ts:190-200` no lee `{"error": …}` | Propuesto: igual que H-43 y H-F3-3 | Abierto (no aplicado) |
| H-F6-6 | F6 | FLU-INV-003c | **Back** / tipos | Media | `POST /api/tipos/` acepta nombre vacío y repetido (201) | `Tipo.nombre` sin validación (`producto/models.py`) | — | **Reportado al back** |
| H-F6-7 | F6 | FLU-INV-004b | **Back** / productos | Media | Se acepta `precio_venta` negativo, nombre vacío e `id_tipo` inexistente (queda `null`) | `producto/services/producto_service.py` (`create`) no valida | — | **Reportado al back** |
| H-F6-8 | F6 | FLU-INV-005c | **Back** / productos | Media | `codigo_barras` repetido se acepta; la búsqueda por código devuelve solo uno | Sin restricción de unicidad | — | **Reportado al back** |
| H-F6-9 | F6 | FLU-SUC-004 | **Back** / sucursales | Baja | Nombre de sucursal repetido se acepta (201) | `nombre_sucursal` no es único (`sucursales/models.py`) | — | **Reportado al back** |
| H-F6-10 | F6 | FLU-SUC-003b | **Back** / sucursales | Media | Solo exige `ubicacion`: acepta nombre vacío y correo inválido | Sin validación en el back de sucursales | — | **Reportado al back** |

---

## 8. Decisiones pendientes

| ID | Decisión | Recomendación |
|---|---|---|
| D-1 | Cómo cargar la semilla (sección 1.2) | **Resuelta**: `manage.py seed_e2e` (`usuario/management/commands/`); `npm run e2e:back` resetea `db.e2e.sqlite3`, migra, siembra y levanta |
| D-2 | Tarjeta: ¿solo es un método de pago o hay pasarela? | Confirmar en el POS; si hay pasarela, usar su modo de prueba |
| D-3 | Campos exactos de clientes y proveedores (RFC, teléfono) | Confirmar con los formularios al implementar F3 |
| D-4 | Umbral de stock bajo usado en `FLU-NOT` | Leerlo de `notifications/services/thresholds.py` en la semilla |
| D-5 | `/manager` es maqueta (H-F4-1) | **Resuelta**: construir la gestión de cajeros del gerente como tarea aparte al terminar F6 y quitar el `fixme` de FLU-GER-001b/002b |

---

## 9. Registro de avance

| Fase | Fecha | Casos | Pasan | Fallan | Hallazgos | Notas |
|---|---|---|---|---|---|---|
| F0 | 2026-11-19 | 3 | 3 | 0 | H-F0-1, H-F0-2, H-F0-3 | `seed_e2e` + `e2e:back` + `e2e:flujos`; `FLU-AUT-001` x3 en verde; suite con mocks 61 ok / 7 skip; back 675 ok |
| F1 | 2026-11-19 | 25 | 25 | 0 | H-F1-1, H-F1-2 | Matriz 3 cajeros × Efectivo/Tarjeta verificada en BD; 3 corridas sin reset + 1 con reset; `--retries=0` en verde. Historial sin filtro de fecha/sucursal en la UI → FLU-HIS-002 cubre folio/cajero/método |
| F2 | 2026-11-19 | 14 | 14 | 0 | H-F2-1, H-F2-2 | F1+F2 juntas 39/39 con BD recién reseteada y `--retries=0`. Sin UI: usuario en movimientos (IXS-005) y historial de precios (PRE-003) → verificados por API/BD |
| F3 | 2026-11-19 | 19 | 17 | 2 (fixme back) | H-F3-1..5 | F1–F3 juntas 56 ok / 2 fixme con BD reseteada y `--retries=0`; jest 1590/1590; E2E con mocks 61 ok. F2 sigue verde con el fix del back `e952c4a`. Sin UI: búsqueda/paginación de clientes, edición de rol/sucursal en `/admin` (USR-002 por API). Back sin regla de duplicados en clientes/proveedores |
| F4 | 2026-11-19 | 15 | 11 | 4 (2 back, 2 UI sin construir) | H-F4-1..4 | F1–F4 juntas 71 ok / 6 fixme con BD reseteada y `--retries=0`; jest 1592/1592; E2E con mocks 64 ok. Seed: `gerente.general` sin `is_staff` (con staff el back lo trata como admin). Reportes solo en PDF: se leen con `pdftotext` |
| F5 | 2026-11-19 | 64 | 64 | 0 | — | 12 rutas × 4 roles sin 403 del back en la carga; F1–F5 juntas 137 ok / 4 fixme con BD reseteada y `--retries=0`. Back `09e1fe7` cerró H-F3-4 y H-F3-5 (USR-003b/005b activos) |
| F6 | 2026-11-19 | 38 | 26 | 12 | H-F6-1..12 | F1–F6 juntas 162 ok / 16 fixme con BD reseteada y `--retries=0`; `@smoke` 9/9. Sucursales UI sin bugs. Productos: 7 bugs de front sin aplicar (módulo del otro equipo) y 5 del back. Sin UI: CRUD de tipos de producto |
