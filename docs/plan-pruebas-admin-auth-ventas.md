# Plan de pruebas — Rol Admin, Auth y Ventas

> Fecha: 2026-11-13 · Alcance: módulos asignados (auth, ventas y todo lo exclusivo del rol admin)
> Relación: este plan es un subconjunto ejecutable de [`plan-pruebas.md`](plan-pruebas.md) (plan maestro).
> Los IDs `SIS-xxx` vienen de [`casos-sistema.md`](casos-sistema.md).
> Stack: Jest + jest-preset-angular + Testing Library + ng-mocks (unit/integración) · Playwright + axe (E2E).

---

## 1. Alcance

| Módulo | Ruta | Archivos fuente* | Specs hoy | Meta líneas |
|---|---|---|---|---|
| Auth | `features/auth` | 24 | 11 | ≥ 90 % |
| Ventas | `features/sales` (incluye `product-types`) | 62 | 17 | ≥ 85 % |
| Admin | `features/admin` | 1 | 0 | ≥ 80 % |
| Sucursales | `features/branches` | 13 | 0 | ≥ 80 % |
| Precios por sucursal | `features/branch-pricing` | 13 | 0 | ≥ 85 % (dinero) |
| Usuarios | `features/users` | 8 | 0 | ≥ 80 % |
| Control de acceso por rol | `app.routes.ts`, guards, `shell/config/sidebar-menu.defaults.ts` | — | parcial | 100 % casos |

\* Sin contar DTOs, `index.ts` ni `*.routes.ts`.

**Fuera de alcance** (otros integrantes): inventory, inventory-by-branch, reports, sales-history, suppliers, clients, notifications, manager.
De `inventory-by-branch` y `manager` solo se prueba **que el rol correcto pueda entrar** (control de acceso), no su funcionalidad.

**No se escriben specs para** (no tienen lógica o se cubren indirectamente): DTOs, interfaces `domain/repository/*`, `config/*-endpoints.ts`, enums, `*.errors.ts`, `sales-ui.models.ts`, `product-card-skeleton.component.ts`, `refounds.page.ts` (stub).

---

## 2. Cómo ejecutar este plan (costo con plan Pro de $20)

### 2.1 Reglas de ahorro

0. **Siempre caveman ultra.** Toda sesión y todo subagente arranca con `/caveman ultra` (skill `caveman`, modo ultra). Solo cambia la forma de responder: el código, los specs, los commits y este documento se escriben normal.
0b. **Nunca en `master`.** Todo el trabajo va en la rama `test/admin-auth-ventas` (se crea en la Fase 0 y las siguientes sesiones la reutilizan; verificar con `git branch --show-current` al iniciar). Commits frecuentes en formato Conventional Commits: uno por lote de specs (`test(sales): agrega specs de mappers`) y uno por hallazgo corregido (`fix(auth): … (H-01)`). Nunca hacer commit con tests en rojo. Push o PR solo cuando el usuario lo pida.
1. **Una sesión nueva por fase.** Este archivo es el traspaso entre sesiones: cada sesión lee el plan, hace su fase, marca checkboxes y llena el [Registro de avance](#8-registro-de-avance). No arrastrar conversaciones largas.
2. **Modelo principal: Sonnet.** Opus solo en la Fase 0 (auditoría) si queda cuota; si no, Sonnet también.
3. **graphify antes de leer código**: `graphify query "<pregunta>"`, `graphify explain "<Símbolo>"`, `graphify path "A" "B"`. Leer archivos completos solo para el archivo que se está probando y su spec de referencia.
4. **Subagentes solo donde hay lotes independientes** (Fases 3 y 4), máximo **2 en paralelo**, tipo `general-purpose` con `model: sonnet`. Cada subagente arranca en frío y relee archivos, así que más subagentes = más tokens totales. Si la cuota de la ventana de 5 h va baja, ejecutar los lotes en secuencia en la sesión principal.
5. Al cerrar cada fase: `graphify update .` y commit en `test/admin-auth-ventas`.

### 2.2 Prompt para abrir cada sesión

```
/caveman ultra
Lee docs/plan-pruebas-admin-auth-ventas.md y ejecuta SOLO la Fase N.
Trabaja en la rama test/admin-auth-ventas (nunca en master) y haz commit por lote o hallazgo.
Usa graphify query/explain antes de abrir código. Marca los checkboxes al terminar
cada tarea, registra hallazgos en §5 y llena el Registro de avance (§8).
Al final corre `graphify update .` y no avances a la siguiente fase.
```

### 2.3 Prompt para un subagente (lotes de Fases 3 y 4)

```
Usa la skill caveman en modo ultra para toda tu respuesta.
Escribe specs unitarios para estos archivos: <lista exacta>.
Copia el estilo de <spec de referencia de §3.2>. Un spec junto a cada archivo.
Corre `npx jest <rutas> --silent` hasta verde.
NO modifiques código de producción. Si un test revela un bug, no lo ajustes para que pase:
déjalo como `it.todo('BUG: …')` y repórtalo (archivo:línea, entrada, esperado vs real).
Responde en ≤ 10 líneas: specs creados, nº de tests, bugs encontrados.
```

### 2.4 Estimado

~10–13 sesiones: F0 1 · F1 1 · F2 1 · F3 2–3 · F4 1–2 · F5 1–2 · F6 2 · F7 1.

---

## 3. Convenciones

### 3.1 Archivos y comandos

| Nivel | Nombre | Comando |
|---|---|---|
| Unitaria (lógica) | `<archivo>.spec.ts` | `npx jest src/app/features/<módulo> --silent` |
| Unitaria (componente con DOM) | `<archivo>.functional.spec.ts` | igual |
| Integración | `<archivo>.integration.spec.ts` | `npm run test:integration` |
| E2E | `e2e/<área>.<flujo>.spec.ts` | `npx playwright test e2e/<archivo>` |

Cobertura de un módulo:

```bash
npx jest src/app/features/auth --coverage --coverageThreshold='{}' --collectCoverageFrom='src/app/features/auth/**/*.ts' --collectCoverageFrom='!**/*.spec.ts' --collectCoverageFrom='!**/*.dto.ts'
```

Si `npx jest` falla por configuración, usar `npm test -- --test-path-pattern=features/auth`.

### 3.2 Specs de referencia (copiar estilo, no reinventar)

| Tipo | Referencia |
|---|---|
| Entidad / value object | `sales/domain/value-objects/money.value.spec.ts`, `auth/domain/entities/auth-session.entity.spec.ts` |
| Mapper | `auth/infrastructure/mappers/auth-session.mapper.spec.ts` |
| Use case | `auth/application/usecase/login.usecase.spec.ts` |
| Repository impl (HTTP) | `sales/infrastructure/repositories/sale-repository.impl.spec.ts` |
| Facade | `sales/application/facades/sales.facade.spec.ts` |
| Componente | `sales/presentation/components/client-selector-modal/client-selector-modal.component.spec.ts` |
| Integración | `auth/infrastructure/repositories/auth-flow.integration.spec.ts`, `sales/application/usecase/create-complete-sale.integration.spec.ts` |
| E2E con mocks | `e2e/auth.login.spec.ts` + `e2e/helpers/backend.ts` |

### 3.3 Reglas de los tests

- Patrón AAA; nombres en español que describan el comportamiento (`'rechaza cantidad mayor al stock'`).
- Probar comportamiento público, no detalles internos. Componentes con Testing Library (roles/labels), no selectores CSS.
- Mocks de repositorios con `ng-mocks` o `{ provide: X, useValue: jest.fn… }`; HTTP con `provideHttpClientTesting` + `HttpTestingController`.
- Cada use case: camino feliz + cada rama de error. Cada mapper: ida, vuelta y campos nulos/opcionales. Dinero: decimales, redondeo, negativos y cero.
- Si un componente ya tiene `*.functional.spec.ts`, ampliar ese archivo en vez de crear otro.
- Un test nunca se ajusta para que pase con un bug: se registra el hallazgo (§4).

---

## 4. Hallazgos: severidad y qué se arregla

| Severidad | Criterio | Acción |
|---|---|---|
| 🔴 Crítico | Acceso no autorizado; fuga de tokens o credenciales; open redirect; XSS; cobro o total incorrecto; doble venta; pérdida de datos; crash en login o en el cobro | Se arregla **siempre**, primero el test que falla y luego el fix |
| 🟠 Grave | Violación de capas (presentation → infrastructure directo, domain dependiendo de Angular/HTTP); lógica de negocio en componentes; datos hardcodeados en pantallas productivas; errores silenciados; fugas de suscripciones en páginas principales | Se arregla si el cambio es acotado (≈ ≤ 50 líneas); si es más grande se registra y se decide con el equipo |
| 🟡 Menor | Nombres, typos, estilo, duplicación leve | Solo se registra |

Si un test revela un bug 🟡, queda como `it.todo('H-xx: …')`.

---

## 5. Registro de hallazgos

Preliminares (exploración del 2026-11-13). La Fase 0 los confirma y agrega los nuevos.

| ID | Sev. | Hallazgo | Dónde | Fase | Estado |
|---|---|---|---|---|---|
| H-01 | 🔴 | `authGuard` solo valida sesión, no rol: un cajero entra a `/admin`, `/branches`, `/branch-pricing`, `/inventory-by-branch` o `/manager` escribiendo la URL. F0 confirma: ninguna ruta de `app.routes.ts` declara `data.roles` | `auth/presentation/guards/auth.guard.ts`, `app.routes.ts` | F1 | Confirmado |
| H-02 | 🟠 | El sidebar muestra "Administración" y "Cajeros" al rol `seller` (F0 confirma: `roles: ['admin', 'seller', 'manager']` en ambos) | `shell/config/sidebar-menu.defaults.ts:73,87` | F1 | Confirmado |
| H-03 | 🟠 | `admin-management.page` usa datos hardcodeados (`branches`, `users`, `managerOptions` en líneas 32, 59, 86), sin facade ni use case; la feature `users` solo tiene domain/application/infrastructure, sin facade ni UI. **Decisión F0 (usuario): opción (a)**, conectar la página a facades de `users` (crear `users.facade`) y `branches` | `features/admin`, `features/users` | F1 | Decidido (a) |
| H-04 | 🟡 | Sesión con "recordar" se guarda en localStorage (expuesta ante XSS). Electron mitiga; documentar | `auth/application/services/session-state.service.ts` | — | Registrado |
| H-05 | 🟡 | Contraseñas de cuentas de prueba versionadas en el repo | `e2e/fixtures/test-users.ts` | F0 | Cerrado: el usuario confirma que son solo de la BD de pruebas |
| H-06 | 🟡 | `refounds.page` es un stub y el nombre tiene typo (refunds) | `sales/presentation/pages/refounds` | — | Fuera de alcance |
| H-07 | ⚪ | `jest.config.js` reporta 8 suites rojas preexistentes | `jest.config.js` | F0 | Cerrado: hoy 88/88 suites en verde (626 tests + 1 todo); ninguna roja en auth/sales. El comentario del config está desactualizado |
| H-08 | 🔴 | **Doble venta.** Si `getSaleTicket` falla después de crear venta y detalles, el error llega a la página como "No fue posible registrar la venta", el carrito no se limpia (`tap` solo en éxito) y el cajero puede cobrar otra vez → venta duplicada | `sales/application/usecase/create-complete-sale.usecase.ts` (`concatMap` → `getSaleTicket`), `sales/presentation/state/sales-cart.service.ts:144` | F1 | Pendiente |
| H-09 | 🟠 | Rollback parcial de venta: los detalles se crean en paralelo (`forkJoin`); si uno falla se borra la venta, pero los detalles ya creados y el stock descontado dependen de que el backend haga cascada. Si `deleteSale` falla, la venta queda huérfana y solo se registra en log. Candidato a 🔴 | `create-complete-sale.usecase.ts` (`catchError` del `forkJoin`) | F5 (INT-05) confirma | Pendiente |
| H-10 | 🟠 | Lógica de negocio en el componente: `processTransaction` revalida stock contra inventario, arma el payload del ticket en snake_case para Electron y lee `window.desktop` directamente | `sales/presentation/pages/sales/sales.page.ts:256-326` | F1 si ≤ 50 líneas, si no se decide con el equipo | Pendiente |
| H-11 | 🟡 | `desktop.generateTicket(...).then(...)` sin `.catch`: si el IPC rechaza, queda una promesa rechazada sin manejar y el cajero no ve error | `sales.page.ts` (`processTransaction`) | — | Registrado |
| H-12 | 🟡 | Redondeo de dinero con `toFixed(2)` sobre `number` (p. ej. `1.005.toFixed(2)` → `1.00`) | `sales/domain/entities/order.entity.ts:22,41,46,51` | F3 (tests de decimales) | Registrado |
| H-13 | ⚪ | El front suma IVA 16 % sobre `precio` (`order.entity.ts:28`); verificar que el total mostrado en el carrito coincide con el total del ticket del backend | `order.entity.ts`, `sales-cart.service.ts:37-39` | F5 (INT-06) | Por verificar |
| H-14 | 🟡 | Precio por sucursal validado solo en la UI (`Validators.min(0.01)`), sin límite de 2 decimales; ni use case ni entidad validan | `branch-pricing/presentation/components/set-price-dialog/set-price-dialog.component.ts:33` | F4 | Registrado |
| H-15 | 🟡 | `result as any` al pasar el resultado del diálogo a la facade y `subscribe` anidados | `branches/presentation/pages/branches-page/branches.page.ts:51,71`, `branch-pricing/presentation/pages/branch-pricing-page/branch-pricing.page.ts:51` | — | Registrado |
| H-16 | 🟡 | Violación de capas leve: application importa de infrastructure (`withBearerToken`) | `auth/application/services/auth-token-refresh-orchestrator.service.ts:16` | — | Registrado |
| H-17 | 🟡 | Electron: `console.log(preview)` imprime el ticket completo en el log del proceso principal; el texto ESC/POS no filtra caracteres de control (datos vienen del backend) | `electron/ipc/printer.ipc.js:36`, `electron/printer/ticket-escpos.js:4` | — | Registrado |
| H-18 | 🟡 | `redirectTo` del login no se valida. No es open redirect (`navigateByUrl` solo navega dentro del router), pero acepta cualquier ruta | `auth/presentation/pages/login/login.page.ts:62-63` | F2 (test) | Registrado |

Revisado sin hallazgo: no hay `[innerHTML]` ni `bypassSecurityTrust*` en `src/app`; los logs de auth no imprimen valores de tokens ni contraseñas; `buildHttpErrorLog` usa URL sanitizada y no incluye el body de la petición; Electron con `contextIsolation: true` y `nodeIntegration: false`; presentation no importa infrastructure en estos módulos; `domain/repository/*` usa `Observable` de rxjs (convención aceptada); el carrito respeta el stock al agregar/incrementar; `processTransaction` tiene guarda contra doble clic (`isCreatingSale`); los `subscribe` sin `takeUntilDestroyed` en branches/branch-pricing son de HTTP o `dialogRef.closed` (completan solos, no hay fuga).

---

## 6. Fases

### Fase 0 — Línea base y auditoría
**Sesión:** 1 · **Modelo:** Opus si hay cuota, si no Sonnet · **Subagentes:** no

- [x] Revisar `git status` en `master`: los cambios sin commit que ya existen se guardan en un commit propio o se dejan fuera, según decida el usuario, para no mezclarlos con las pruebas. *(Decisión: se dejan fuera, sin commit; solo se commitean archivos del plan.)*
- [x] Crear la rama: `git switch -c test/admin-auth-ventas`.
- [x] `graphify update .`
- [x] Correr las suites existentes de auth y ventas; registrar PASS/FAIL en §8 (H-07).
- [x] Reparar las suites rojas de estos módulos **si el problema es el test** (deriva de contrato con el backend). Si el problema es el código → hallazgo. *(No había suites rojas.)*
- [x] Cobertura base por módulo (comando de §3.1) → §8.
- [x] `npx playwright test e2e/auth.login.spec.ts` como línea base E2E.
- [x] Auditoría con este checklist (usar `graphify explain`/`path` para ver dependencias entre capas):
  - **Seguridad:** control por rol (H-01); `redirectTo` del login (¿puede redirigir fuera de la app?); tokens o contraseñas en logs (`LoggerService`); `[innerHTML]` o `bypassSecurityTrust*`; datos del ticket enviados a la impresora (Electron).
  - **Arquitectura:** imports de `infrastructure` desde `presentation`; `domain` importando `@angular/*`; lógica de negocio en componentes (`sales.page.ts` tiene 343 líneas); suscripciones sin `takeUntilDestroyed`.
  - **Bugs:** aritmética de dinero (`Money`, IVA, subtotal); límite de stock; doble clic en "cobrar"; venta creada cuando falla un detalle (`create-complete-sale`); validaciones de precio en branch-pricing (negativos, decimales).
- [x] Decidir H-03: (a) conectar `admin-management.page` a las facades de `users` y `branches` (recomendado si el backend `/api/users` ya responde) o (b) dejarla como maqueta y probar solo render + acceso. *(Decisión: (a).)*
- [x] Confirmar H-05 con el equipo. *(Confirmado: solo BD de pruebas.)*
- [x] Completar §5 con severidad y fase de cada hallazgo nuevo.

**Salida:** §5 y §8 completos; ninguna suite de estos módulos en rojo por culpa del test.

### Fase 1 — Correcciones críticas (TDD)
**Sesión:** 1 · **Modelo:** Sonnet · **Subagentes:** no

- [ ] **H-01:** test que falla → `roleGuard` funcional en `auth/presentation/guards/role.guard.ts` que lee `route.data['roles']` y compara con `SessionStateService.role()`; si no autoriza, redirige a `/sales`.
  - `app.routes.ts`: `data: { roles: [...] }` → `/admin`, `/branches`, `/branch-pricing`: admin · `/inventory-by-branch`, `/manager`: admin, manager.
  - Spec del guard: sin sesión, rol permitido, rol no permitido, ruta sin `data.roles`.
- [ ] **H-02:** corregir roles de `/admin` y `/manager/cashiers` en el sidebar + test de `shell/utils/sidebar-filter.utils.ts`.
- [ ] **H-03:** aplicar la opción decidida en F0.
- [ ] Resto de 🔴 y 🟠 de la Fase 0, cada uno con su test primero.
- [ ] Suites de auth, sales y shell en verde.
- [ ] Un commit por hallazgo (`fix(auth): restringe rutas por rol (H-01)`).

### Fase 2 — Unitarias Auth
**Sesión:** 1 · **Modelo:** Sonnet · **Subagentes:** no (módulo chico)

- [ ] Lote A — domain e infraestructura pura: `domain/entities/user-profile.entity.ts`, `infrastructure/mappers/auth-role.mapper.ts`, `infrastructure/mappers/profile.mapper.ts`, `infrastructure/http/auth-token-http.utils.ts`
- [ ] Lote B — application: `usecase/refresh.usecase.ts`, `usecases/get-my-profile.usecase.ts`, `usecases/update-my-sucursal.usecase.ts`, `commands/login.command.ts` (si tiene validación)
- [ ] Lote C — infraestructura HTTP: `repositories/profile-repository.impl.ts`
- [ ] Ampliar specs existentes:
  - `login.page.spec.ts`: recordar sesión, `redirectTo`, errores 401/500/red, botón deshabilitado mientras carga (no doble envío).
  - `session-state.service.spec.ts`: sesión expirada en storage, JSON corrupto, legado → actual, logout limpia ambos storages.
  - `auth-token.interceptor.spec.ts`: no adjunta token a la petición de refresh ni a hosts externos.
- [ ] Cobertura `features/auth` ≥ 90 % líneas → §8.

### Fase 3 — Unitarias Ventas
**Sesiones:** 2–3 · **Modelo:** Sonnet · **Subagentes:** sí, 2 en paralelo (A+B y C+D), E en la sesión principal

- [ ] Lote A — domain: `sale.entity`, `sale-detail.entity`, `detailed-sale.entity`, `payment-method.entity`, `sale-ticket.entity`, `value-objects/sale-date.value`, `product-types/domain/entities/product-type.entity`
- [ ] Lote B — mappers: `sale.mapper`, `sale-detail.mapper`, `detailed-sale.mapper`, `payment-method.mapper`, `sale-ticket.mapper`, `product-types/.../product-type.mapper`
- [ ] Lote C — use cases: `create-sale`, `create-sale-detail`, `create-complete-sale` (unit; ya existe integración), `update-sale`, `update-sale-detail`, `delete-sale`, `delete-sale-detail`, `get-sales`, `get-sale-detail`, `get-sale-details`, `get-sale-ticket`, `get-payment-methods`, `product-types/*` (4), `strategies/sales-search.strategy`
- [ ] Lote D — infraestructura: `payment-method-repository.impl`, `sale-detail-repository.impl`, `product-type-repository.impl`, `utils/http-error-resolver`
- [ ] Lote E — facades y presentation (sesión principal, depende de A–D):
  - `product-types.facade`
  - Componentes nuevos: `cart-item`, `cart-panel`, `product-grid`, `quantity-control`, `sales-summary`
  - Ampliar los `*.functional.spec.ts` existentes: `category-slider`, `payment-method-selector`, `product-card`, `ticket-modal`, `sales.page` (búsqueda por código de barras, cargar más, cliente, cobro sin método de pago, carrito vacío)
  - `sales-cart.service.spec.ts`: límite de stock, cantidad 0 o negativa, subtotal/IVA/total con decimales
- [ ] Cobertura `features/sales` ≥ 85 % líneas → §8.

### Fase 4 — Unitarias Rol Admin
**Sesiones:** 1–2 · **Modelo:** Sonnet · **Subagentes:** sí, 2 en paralelo (branches + users | branch-pricing + admin)

- [ ] **branches:** `branch.entity`, `branch.mapper`, `branch-repository.impl`, 5 use cases (`create`, `update`, `delete`, `get-branches`, `get-branch-by-id`), `branches.facade`, `branch-card`, `branch-form-dialog` (validaciones), `branches.page`
- [ ] **branch-pricing:** `branch-price.entity`, `price-history-item.entity`, `branch-price.mapper`, `branch-price-repository.impl`, 4 use cases (`set-branch-price`, `get-active-price`, `get-price-history`, `deactivate-price`), `branch-pricing.facade`, `branch-pricing-table`, `set-price-dialog` (precio negativo, cero, decimales, vacío), `branch-pricing.page`
- [ ] **users:** `user.entity`, `user.mapper`, `user-repository.impl`, 4 use cases (`create`, `update`, `delete`, `get-users`)
- [ ] **admin:** `admin-management.page` según la decisión H-03
- [ ] Cobertura por módulo → §8 (metas de §1).

### Fase 5 — Integración
**Sesiones:** 1–2 · **Modelo:** Sonnet · **Subagentes:** no (necesita contexto entre módulos)

Ya existen: `auth-flow`, `sale-auth`, `create-complete-sale`, `sales-facade`, `sales-page`. Agregar:

- [ ] INT-01 Login → perfil → cambio de sucursal (use cases + repos + `HttpTestingController`).
- [ ] INT-02 Refresh concurrente: dos peticiones reciben 401 a la vez → un solo refresh → ambas se reintentan. Si el refresh falla → sesión limpia y redirección a login.
- [ ] INT-03 Logout limpia storage persistente y en memoria; el guard bloquea después.
- [ ] INT-04 Router + `authGuard` + `roleGuard`: sin sesión → `/login?redirectTo=…`; seller → `/admin` redirige; admin entra a `/admin`, `/branches`, `/branch-pricing`; manager entra a `/inventory-by-branch` pero no a `/branches`.
- [ ] INT-05 Venta completa donde falla un detalle: verificar qué pasa con la venta ya creada (¿se borra o queda huérfana?). Candidato a hallazgo 🔴.
- [ ] INT-06 El total, IVA y detalles del carrito coinciden con el payload enviado al backend.
- [ ] INT-07 Branches: CRUD facade + repo; la lista se refresca tras crear/editar/borrar; errores 400/409 visibles.
- [ ] INT-08 Branch pricing: fijar precio → aparece en historial → es el precio activo; desactivar.
- [ ] INT-09 Users: CRUD use cases + repo (+ admin page si se conectó en H-03).

### Fase 6 — E2E (Playwright con mocks)
**Sesiones:** 2 · **Modelo:** Sonnet · **Subagentes:** no (comparten `ng serve`)

- [ ] Helpers en `e2e/helpers/backend.ts`: `mockLoginAs(page, role)` y `mockApi(page, ruta, body, status?)`; fixtures de productos, sucursales, precios y usuarios en `e2e/fixtures/`.
- [ ] `e2e/auth.session.spec.ts`: SIS-004, SIS-005, SIS-006.
- [ ] `e2e/sales.pos.spec.ts`: SIS-010 a SIS-016.
- [ ] `e2e/admin.access.spec.ts` — **SIS-053 (nuevo)**: seller no ve ni entra a `/admin`, `/branches`, `/branch-pricing`; admin sí; manager solo a lo suyo.
- [ ] `e2e/admin.branches.spec.ts`: SIS-030.
- [ ] `e2e/admin.pricing.spec.ts`: SIS-023.
- [ ] SIS-050 usuarios y roles (según H-03).
- [ ] Agregar `/sales`, `/branches` y `/branch-pricing` a `e2e/a11y.smoke.spec.ts` (SIS-061).
- [ ] Opcional: 1 smoke contra el backend real (`*.real.spec.ts` + `wakeBackend()`).

### Fase 7 — Cierre y evidencia
**Sesión:** 1 · **Modelo:** Sonnet · **Subagentes:** no

- [ ] `coverageThreshold` por carpeta en `jest.config.js` con las metas de §1 (`'./src/app/features/auth/': { lines: 90, … }`).
- [ ] `npm run test:coverage` y `npm run e2e` en verde.
- [ ] Análisis Sonar (`sonar-project.properties`) sin issues bloqueantes en estos módulos.
- [ ] Agregar SIS-053 a `docs/casos-sistema.md` y enlazar este plan desde `docs/plan-pruebas.md`.
- [ ] Tabla final para la tesis en §8: tests por nivel y módulo, cobertura antes/después, hallazgos corregidos.
- [ ] `graphify update .`

---

## 7. Trazabilidad casos de sistema ↔ pruebas

| Caso | Descripción | Integración | E2E |
|---|---|---|---|
| SIS-001–003 | Login válido, inválido, vacío | `auth-flow` | `auth.login` (existe) |
| SIS-004 | Guard sin sesión | INT-04 | `auth.session` |
| SIS-005 | Sesión persistente + refresh | INT-02 | `auth.session` |
| SIS-006 | Logout | INT-03 | `auth.session` |
| SIS-010–016 | POS: venta, vacío, pago, inventario, stock, totales, búsqueda | INT-05, INT-06, `sales-page` | `sales.pos` |
| SIS-023 | Precio por sucursal | INT-08 | `admin.pricing` |
| SIS-030 | CRUD sucursales | INT-07 | `admin.branches` |
| SIS-050 | Usuarios y roles | INT-09 | según H-03 |
| SIS-053 | Acceso por rol (nuevo) | INT-04 | `admin.access` |
| SIS-061 | Accesibilidad | — | `a11y.smoke` |

---

## 8. Registro de avance

### Línea base (Fase 0)

| Módulo | Suites PASS/FAIL | Líneas | Ramas | Funciones |
|---|---|---|---|---|
| auth | 11 / 0 | 84.2 % (346/411) | 63.7 % (58/91) | 70.0 % (70/100) |
| sales | 17 / 0 | 78.8 % (759/963) | 58.2 % (117/201) | 66.2 % (188/284) |
| admin | 0 / 0 (sin specs) | 0 % (0/10) | — (0/0) | 0 % (0/3) |
| branches | 0 / 0 (sin specs) | 0 % (0/186) | 0 % (0/38) | 0 % (0/56) |
| branch-pricing | 0 / 0 (sin specs) | 0 % (0/184) | 0 % (0/25) | 0 % (0/52) |
| users | 0 / 0 (sin specs) | 0 % (0/48) | — (0/0) | 0 % (0/15) |

Comando: `npx jest src/app/features/auth src/app/features/sales --coverage` con `collectCoverageFrom` de los 6 módulos (sin `*.spec.ts` ni `*.dto.ts`), 2026-11-13. auth + sales: 28/28 suites, 218 tests en verde + 1 `it.todo` (`auth.facade.spec.ts:80`, "logs out user"). Proyecto completo: 88/88 suites, 626 tests + 1 todo.
E2E base: `npx playwright test e2e/auth.login.spec.ts --project=chromium` → 4/4 en verde (SIS-001 a SIS-004), 11.3 s.

### Sesiones

| Fecha | Fase | Modelo | Hecho | Hallazgos nuevos | Pendiente |
|---|---|---|---|---|---|
| 2026-11-13 | F0 | Opus | Rama `test/admin-auth-ventas` creada (cambios previos de `master` fuera, sin commit); línea base Jest + cobertura + E2E; auditoría seguridad/arquitectura/bugs; H-03 = (a); H-05 y H-07 cerrados | H-08 🔴 doble venta si falla el ticket · H-09 🟠 rollback parcial · H-10 🟠 lógica en `sales.page` · H-11 a H-18 🟡/⚪ | F1: H-01, H-02, H-03 (a), H-08, H-10 (si ≤ 50 líneas) |

### Resultado final (Fase 7)

| Módulo | Unit | Integración | E2E | Líneas antes → después | Hallazgos corregidos |
|---|---|---|---|---|---|
| auth | | | | | |
| sales | | | | | |
| rol admin | | | | | |
