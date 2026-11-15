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
6. **Código del backend (solo lectura).** Para contratos de API, validaciones, cascadas o reglas de negocio, consultar:
   - Local: `/home/enigma/Documentos/Refaccionaria/RefaccionariaBack` (rama de trabajo actual: `Develop`).
   - Remoto: <https://github.com/cuboalcub/RefaccionariaBack/>.

   Antes de leer, actualizar siempre: `git -C /home/enigma/Documentos/Refaccionaria/RefaccionariaBack pull --ff-only`. Si falla porque hay cambios locales o ramas divergentes, no forzar nada: `git fetch` y leer la versión remota con `git show origin/<rama>:<ruta>`. Nunca editar, hacer commit ni push en el backend; si algo se debe cambiar ahí, registrarlo como hallazgo en §5.

### 2.2 Prompt para abrir cada sesión

```
/caveman ultra
Lee docs/plan-pruebas-admin-auth-ventas.md y ejecuta SOLO la Fase N.
Trabaja en la rama test/admin-auth-ventas (nunca en master) y haz commit por lote o hallazgo.
Si necesitas el backend, sigue la regla 6 de §2.1 (pull primero, solo lectura).
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
| H-01 | 🔴 | `authGuard` solo valida sesión, no rol: un cajero entra a `/admin`, `/branches`, `/branch-pricing`, `/inventory-by-branch` o `/manager` escribiendo la URL. F0 confirma: ninguna ruta de `app.routes.ts` declara `data.roles` | `auth/presentation/guards/auth.guard.ts`, `app.routes.ts` | F1 | Corregido (`f01f164`): `roleGuard` + `data.roles` en las 5 rutas; spec del guard y de `app.routes` |
| H-02 | 🟠 | El sidebar muestra "Administración" y "Cajeros" al rol `seller` (F0 confirma: `roles: ['admin', 'seller', 'manager']` en ambos) | `shell/config/sidebar-menu.defaults.ts:73,87` | F1 | Corregido (`d3dc434`): `/admin` solo admin, `/manager/cashiers` admin+manager; test en `sidebar-filter.utils.spec.ts` |
| H-03 | 🟠 | `admin-management.page` usa datos hardcodeados (`branches`, `users`, `managerOptions` en líneas 32, 59, 86), sin facade ni use case; la feature `users` solo tiene domain/application/infrastructure, sin facade ni UI. **Decisión F0 (usuario): opción (a)**, conectar la página a facades de `users` (crear `users.facade`) y `branches` | `features/admin`, `features/users` | F1 | Corregido (`fd879e5`) con limitación: `users.facade` creado y página conectada a `users` y `branches`. El backend no modela rol, sucursal inicial, gerentes ni cajeros por sucursal, así que se retiraron de la maqueta (asignación de gerentes, columnas rol/sucursal/gerentes/cajeros, tarjetas Gerentes/Cajeros); queda alta y lista de sucursales y de usuarios (username, correo, estado). Si el equipo quiere roles/asignación hay que ampliar primero el backend |
| H-04 | 🟡 | Sesión con "recordar" se guarda en localStorage (expuesta ante XSS). Electron mitiga; documentar | `auth/application/services/session-state.service.ts` | — | Riesgo aceptado: la casilla «Recordar sesión» (H-19) va desmarcada por defecto, así que `localStorage` solo se usa si el usuario lo pide; eliminarlo requiere cookies httpOnly del backend |
| H-05 | 🟡 | Contraseñas de cuentas de prueba versionadas en el repo | `e2e/fixtures/test-users.ts` | F0 | Cerrado: el usuario confirma que son solo de la BD de pruebas |
| H-06 | 🟡 | `refounds.page` es un stub y el nombre tiene typo (refunds) | `sales/presentation/pages/refounds` | — | Corregido (`3690215`): `refounds.page` no estaba ruteado, se borró |
| H-07 | ⚪ | `jest.config.js` reporta 8 suites rojas preexistentes | `jest.config.js` | F0 | Cerrado: hoy 88/88 suites en verde (626 tests + 1 todo); ninguna roja en auth/sales. El comentario del config está desactualizado |
| H-08 | 🔴 | **Doble venta.** Si `getSaleTicket` falla después de crear venta y detalles, el error llega a la página como "No fue posible registrar la venta", el carrito no se limpia (`tap` solo en éxito) y el cajero puede cobrar otra vez → venta duplicada | `sales/application/usecase/create-complete-sale.usecase.ts` (`concatMap` → `getSaleTicket`), `sales/presentation/state/sales-cart.service.ts:144` | F1 | Corregido (`ff5a3ed`): si `getSaleTicket` falla, el use case devuelve `ticket: null` (sin error ni rollback), el carrito se limpia y la página avisa con warning |
| H-09 | 🟠→🔴 | Rollback parcial de venta: los detalles se creaban en paralelo (`forkJoin`) y, si uno fallaba, se borraba la venta con `DELETE /ventas/<id>/`. Confirmado con el backend (`RefaccionariaBack`, Develop): ese DELETE es una cancelación (`estado='cancelada'`), repone el stock y conserva los detalles, pero exige el permiso `ventas.anular`, que el rol `cajero` NO tiene (403) → la venta quedaba completada y huérfana con el stock descontado | `create-complete-sale.usecase.ts` | F1 parcial, F5 (INT-05) | Corregido (`e6a86eb`, ver H-39): una sola petición atómica. Parcial previo `62e5e73` (aviso de venta huérfana) ya no aplica |
| H-10 | 🟠 | Lógica de negocio en el componente: `processTransaction` revalida stock contra inventario, arma el payload del ticket en snake_case para Electron y lee `window.desktop` directamente | `sales/presentation/pages/sales/sales.page.ts:256-326` | F3 (aprobado por el usuario aunque >50 líneas) | Corregido: revalidación en `SalesCartService.findStockIssue`, payload en `sales/application/mappers/ticket-print-payload.mapper.ts`, `window.desktop` tras `DESKTOP_PORT` (`core/ports/desktop.port.ts`); la página bajó 23 líneas netas. Quedan por reusar el mapper/puerto en `ticket-modal.component.ts` (reimpresión, duplica el payload y lee `window.desktop`); no se tocó porque ese archivo tiene cambios sin commit de `master` |
| H-11 | 🟡 | `desktop.generateTicket(...).then(...)` sin `.catch`: si el IPC rechaza, queda una promesa rechazada sin manejar y el cajero no ve error | `sales.page.ts` (`processTransaction`) | — | Corregido (`162f51f`): `.catch` con toast «No fue posible generar el ticket.» |
| H-12 | 🟡 | Redondeo de dinero con `toFixed(2)` sobre `number` (p. ej. `1.005.toFixed(2)` → `1.00`) | `sales/domain/entities/order.entity.ts:22,41,46,51` | F3 (tests de decimales) | Corregido (`5ff094a`): `Money.round2` (mitad hacia arriba, absorbe el error binario); `it.todo` ×2 convertidos en tests |
| H-13 | ⚪→🔴 | El front suma IVA 16 % sobre `precio` (`order.entity.ts`). F5 (INT-06) lo verificó contra el backend: ver H-40 | `order.entity.ts`, `sales-cart.service.ts` | F5 (INT-06) | Corregido (`d9577ec`), junto con H-40 |
| H-14 | 🟡 | Precio por sucursal validado solo en la UI (`Validators.min(0.01)`): sin límite de 2 decimales (acepta 10.999 y lo envía sin redondear), sin tope (`DecimalField(10,2)` del backend, máx 99999999.99) y `setValue('abc')` por código pasa `min` (la UI no lo permite, input number); ni use case ni entidad validan | `branch-pricing/presentation/components/set-price-dialog/set-price-dialog.component.ts:33` | F4 | Registrado (`it.todo('H-14')`, `H-14b`, `H-14c` en `set-price-dialog.component.spec.ts`; los demás casos de precio —negativo, cero, vacío, mínimo 0.01— tienen test) |
| H-15 | 🟡 | `result as any` al pasar el resultado del diálogo a la facade y `subscribe` anidados | `branches/presentation/pages/branches-page/branches.page.ts:51,71`, `branch-pricing/presentation/pages/branch-pricing-page/branch-pricing.page.ts:51` | — | Registrado |
| H-16 | 🟡 | Violación de capas leve: application importa de infrastructure (`withBearerToken`) | `auth/application/services/auth-token-refresh-orchestrator.service.ts:16` | — | Corregido (`b22b4d6`): `auth-token-http.utils` movido a `auth/application/services` |
| H-17 | 🟡 | Electron: `console.log(preview)` imprime el ticket completo en el log del proceso principal; el texto ESC/POS no filtra caracteres de control (datos vienen del backend) | `electron/ipc/printer.ipc.js:36`, `electron/printer/ticket-escpos.js:4` | — | Corregido (`893ea45`): ya no se loguea el ticket y `text()` filtra `\x00-\x1F` salvo `\n` |
| H-18 | 🟡 | `redirectTo` del login no se valida. No es open redirect (`navigateByUrl` solo navega dentro del router), pero acepta cualquier ruta | `auth/presentation/pages/login/login.page.ts:62-63` | F2 (test) | Corregido (`54e58e9`): `redirectTo` solo acepta rutas internas |
| H-19 | 🟡 | `LoginCommand.remember` y la persistencia en `localStorage` existen, pero el formulario de login no tiene casilla "Recordar sesión": la sesión nunca se recuerda desde la UI (código muerto o función faltante) | `auth/presentation/pages/login/login.page.html`, `login.page.ts` | F2 | Corregido (`54e58e9`): casilla «Recordar sesión» desmarcada por defecto, envía `remember` |
| H-20 | 🟡 | `onSubmit()` no revisa `loading()`: el único freno al doble envío es el botón deshabilitado (el navegador no hace envío implícito con el botón deshabilitado, pero un `requestSubmit()` sí pasaría). El facade tampoco lo bloquea | `auth/presentation/pages/login/login.page.ts:onSubmit`, `auth/application/facades/auth.facade.ts:login` | F2 | Corregido (`54e58e9`): `onSubmit()` no hace nada con `loading()` activo |
| H-21 | 🔴 | **Fuga del access token.** `attachAccessToken` agregaba `Authorization: Bearer` a toda petición: a hosts externos (latente, hoy el front no llama a ninguno) y al propio `/token/refresh`. Tras un 401 de un host externo además se reintentaba con el token | `auth/application/services/auth-token-refresh-orchestrator.service.ts` | F2 | Corregido (`b90bc41`): solo URLs relativas o del origen de `APP_ENV.apiUrl`, y nunca en el refresh; tests en el spec del orquestador y en `auth-token.interceptor.integration.spec.ts` |
| H-22 | 🟠 | **Login incorrecto enmascarado.** El interceptor trataba cualquier 401 como "token vencido": sin sesión llamaba a `retryRequestAfterRefresh`, que limpiaba la sesión y lanzaba `Error('No refresh token available')`. El repositorio lo relanzaba tal cual y el cajero veía ese texto en inglés en vez de "Credenciales inválidas" (el regex de toast de SIS-002 es laxo; no se re-ejecutó el e2e para comprobar qué texto se ve en el navegador real) | `auth/infrastructure/http/auth-token.interceptor.ts` | F2 | Corregido (`57c664c`): si la petición no llevaba token, el 401 original pasa intacto; test de integración con el stack real (interceptor + orquestador + repo) y caso en `auth-token.interceptor.spec.ts` |
| H-23 | 🟡 | `Order.setDiscount(NaN)` e `Infinity` no lanzan; después `discount`, `iva` y `total` lanzan "money must be a non-negative number". El descuento hoy no se fija desde la UI | `sales/domain/entities/order.entity.ts:54-57` | F3 | Corregido (`5ff094a`): `setDiscount` lanza con NaN/Infinity |
| H-24 | 🟡 | El tope de 999 unidades por línea solo aplica al acumular: `addItem` con cantidad 1500 en un producto nuevo pasa sin topar. El carrito ya limita por stock, así que no se alcanza desde la UI | `sales/domain/entities/order.entity.ts:62-66` | F3 | Corregido (`5ff094a`): el tope de 999 también aplica a producto nuevo |
| H-25 | 🟡 | `SaleDate.fromPrimitive` usa `Date.parse` legacy: acepta `"abc 1"` y `"12"` (aunque el mensaje promete ISO) y `"2024-02-30"` (lo desborda a 1 de marzo) | `sales/domain/value-objects/sale-date.value.ts:10` | F3 | Corregido (`3af93bc`): `SaleDate` exige ISO y día de calendario real |
| H-26 | 🟡 | `SaleMapper.fromResponseDto` convierte `total` `""` o `null` en 0 (`Number()` sin validar vacío) y lo acepta como venta de $0 | `sales/infrastructure/mappers/sale.mapper.ts:13` | F3 | Corregido (`121187b`): total `""`/`null` se rechaza |
| H-27 | 🟡 | Las mutaciones de métodos de pago y tipos de producto lanzan un mensaje fijo "Failed to …" y pierden el mensaje del backend; `sale-detail` y `getPaymentMethods` sí usan `resolveHttpErrorMessage` | `sales/infrastructure/repositories/payment-method-repository.impl.ts:49,60,69`, `sales/product-types/infrastructure/repositories/product-type-repository.impl.ts:42,53,62` | F3 | Corregido (`c332418`): `resolveHttpErrorMessage` en create/update/delete |
| H-28 | 🟡 | Si la respuesta de crear detalle no trae `subtotal`, `resolveSaleDetailResponse` cae al fallback y devuelve `id: 0` (p. ej. `{id: 3}` → id 0); el id real se pierde | `sales/infrastructure/repositories/sale-detail-repository.impl.ts:101` | F3 | Corregido (`121187b`): el fallback conserva el `id` de la respuesta |
| H-29 | 🟡 | Contrato de errores mezclado: `CreateSaleUseCase` lanza síncrono con datos inválidos, mientras `create-complete-sale` con carrito vacío emite el error por el observable | `sales/application/usecase/create-sale.usecase.ts:16` | F3 | Corregido (`af93d1e`): `CreateSaleUseCase` usa `defer`, el error viaja por el observable |
| H-30 | 🟡 | `codigoPostal` solo tiene `required`: "12345678901" pasa; el backend (`sucursales/models.py`) tiene `max_length=10` y responde 400 | `branches/presentation/components/branch-form-dialog/branch-form-dialog.component.ts:43-46` | F4 | Registrado (`it.todo('H-30')`) |
| H-31 | 🟡 | `numeroTelefono` valida `^[0-9]+$` sin tope: 16 dígitos pasan; el backend tiene `max_length=15` | idem | F4 | Registrado (`it.todo('H-31')`) |
| H-32 | 🟡 | `nombreSucursal` y `ubicacion` de solo espacios pasan `Validators.required`; el backend los recorta y responde 400 por campo vacío | idem | F4 | Registrado (`it.todo('H-32')`) |
| H-33 | 🔴 | **Tabla de precios por sucursal no carga.** `loadProducts` hacía `loading.set(true)` dentro de `effect()` sin `allowSignalWrites`: en Angular 18 lanza NG0600, `getProducts` nunca se llamaba y la tabla quedaba vacía/sin datos. Confirmado en la salida de Jest; no se re-ejecutó en el navegador | `branch-pricing/presentation/components/branch-pricing-table/branch-pricing-table.component.ts:29-38` | F4 | Corregido (`baa5b61`): `untracked(() => loadProducts(...))`; tests de carga, cambio de sucursal y esqueleto (rojo primero) |
| H-34 | 🟠 | **Error silenciado.** Si fallaba el guardado del precio, la página no avisaba (`error: () => {}`) | `branch-pricing/presentation/pages/branch-pricing-page/branch-pricing.page.ts:55` | F4 | Corregido (`baa5b61`): toast de error con el mensaje |
| H-35 | 🟠 | Tras fijar el precio con éxito la tabla no se recargaba y seguía mostrando el precio anterior (el cajero/admin podía volver a fijarlo creyendo que no se guardó) | `branch-pricing.page.ts:51` | F4 | Corregido (`baa5b61`): `BranchPricingTableComponent.reload()` desde la página con `viewChild` |
| H-36 | 🟡 | `branch-price.mapper` usa `parseFloat` sin validar: `precio_venta` `""`, `null` o `"abc"` produce `NaN`, y la tabla pinta "$NaN" con badge "Activo" | `branch-pricing/infrastructure/mappers/branch-price.mapper.ts:14,25`, `branch-pricing-table.component.ts` (`formatPrice`) | F4 | Registrado (`it.todo('H-36')` ×2; solo si el backend omite el campo) |
| H-37 | 🟡 | Casos de uso sin consumidor: `BranchPricingFacade` no expone `deactivatePrice` (existen `DeactivatePriceUseCase` y el repo) y `UsersFacade` solo expone `loadUsers`/`createUser` (existen `update`/`delete` user). Código muerto o función faltante; decidir con el equipo | `branch-pricing.facade.ts`, `users.facade.ts` | F4 | Registrado (`it.todo('H-37')`) |
| H-38 | 🔴 | **No se podía vender contra el backend actual.** El front enviaba y leía `id_metodoPago`; el backend lo renombró a `id_metodo_pago` (migración `ventas/0003`) y `POST /ventas/` responde 400 "Faltan campos obligatorios: id_metodo_pago". La respuesta también traía `id_metodo_pago`, así que `Sale.idMetodoPago` salía `null`. Si el backend de producción ya tiene la migración, el cobro falla siempre | `sales/infrastructure/dtos/*.dto.ts`, `sale.mapper.ts` | F5 (INT-05) | Corregido (`e6a86eb`): `id_metodo_pago` en crear, actualizar y respuesta; tests en rojo primero. Pendiente confirmar la versión desplegada en Render. Los mocks de `e2e/` no usan el campo (se revisa en F6) |
| H-39 | 🔴 | **Venta huérfana con stock descontado.** El rollback por `DELETE /ventas/<id>/` lo ejecuta el cajero, que no tiene `ventas.anular` (403): ante cualquier fallo de un detalle la venta quedaba `completada` con parte del stock descontado. El backend ya ofrece `POST /ventas/` con `detalles` (`crear_venta_completa`, transacción todo o nada, valida stock por línea y devuelve 400 con el detalle de cada línea) | `sales/application/usecase/create-complete-sale.usecase.ts` | F5 (INT-05) | Corregido (`e6a86eb`): el use case hace un solo `POST /ventas/` con `detalles` y luego pide el ticket (H-08 se mantiene); ya no usa `SaleDetailRepository` ni `deleteSale`. El caso de rollback se elimina porque ya no existe estado parcial. Specs unit e integración reescritos (`create-complete-sale.integration.spec.ts` = INT-05) |
| H-40 | 🔴 | **El total que ve el cajero no coincide con el del ticket.** El carrito muestra subtotal + IVA 16 % (p. ej. $139.20 por un producto de $120), pero el backend calcula `subtotal = precio_sucursal × cantidad` y `venta.total = suma de subtotales` SIN IVA; el ticket imprime ese total ($120.00). Una de las dos partes está mal según si `precio_venta` ya incluye IVA | `sales/domain/entities/order.entity.ts`, `sales-cart.service.ts`; backend `ventas/services/venta_service.py` | F5 (INT-06) | Corregido (`d9577ec`). Decisión del usuario: el precio de venta ya incluye IVA; `total` = Σ(precio × cantidad) − descuento, `subtotal` = total/1.16 e `iva` = total − subtotal; el ticket de Electron desglosa lo mismo. `it.todo` y `test.fixme` convertidos en tests |
| H-41 | 🟠 | Backend: `SucursalService._to_dict` devuelve solo `{id, ubicacion}`. El front lee `nombre_sucursal`, `codigo_sucursal`, `numero_telefono`, etc. y los muestra vacíos ("Sin nombre"); al editar, el formulario sale en blanco y el `PUT` puede sobrescribir esos campos con vacío | backend `sucursales/services/sucursal_service.py:10` | F5 (INT-07) | Registrado (cambio en el backend, no se toca). Los specs usan el contrato completo que espera el front |
| H-42 | 🟠 | `BranchesFacade` solo leía `error.error.message`: el backend responde `{"error": "..."}` / `{"detail": "..."}`, así que el usuario veía "Http failure response for …" | `branches/application/facades/branches.facade.ts` | F5 (INT-07) | Corregido (`ea9eb54`): lee `message`, `error` y `detail` |
| H-43 | 🟠 | **Toasts de error que nunca se mostraban.** Los `effect()` que llevan `errorMessage` de la facade al `ToastService` escriben una señal sin `allowSignalWrites`: Angular lanza NG0600 y el aviso se pierde. Afectaba al login ("Credenciales inválidas"), a los errores del POS (ventas, inventario, tipos) y a sucursales. Los specs previos lo ocultaban mockeando el toast | `login.page.ts`, `sales.page.ts` (×3), `branches.page.ts`; sin corregir: `clients/presentation/pages/clients-page/clients.page.ts:36`, `suppliers/.../suppliers.page.ts:32`, `inventory-by-branch/.../inventory.page.ts:35` | F5 (INT-07) | Corregido en login, ventas y sucursales (`ea9eb54`, `429a0bc`), tests con `ToastService` real y rojo primero. Pendiente: las 3 páginas fuera de alcance (mismo arreglo de una línea, falta su test) |
| H-44 | 🟡 | `BranchPriceRepositoryImpl.deactivatePrice` hace `DELETE /precios-sucursal/<id>/`, que en el backend BORRA la fila (y su historial); no desactiva. Para desactivar habría que hacer `PUT {activo: false}`. La UI no lo ofrece (H-37) | `branch-pricing/infrastructure/repositories/branch-price-repository.impl.ts:49` | F5 (INT-08) | Registrado (`it.todo('H-44')`) |
| H-45 | 🟡 | El toast de error al fijar un precio usa `err instanceof Error`, pero el error es un `HttpErrorResponse`: siempre dice "No se pudo actualizar el precio" y se pierde el texto del backend ("precio_venta debe ser mayor a 0") | `branch-pricing/.../branch-pricing.page.ts:55` | F5 (INT-08) | Registrado (`it.todo('H-45')`) |
| H-46 | 🟡 | El login del backend trae `user.rol` (`cajero`/`encargado`/`admin`), que define los permisos, pero el front deduce el rol de `isadmin`/`isstaff`: un staff sin superuser es `manager` en el front y admin para el backend (`es_staff`); un `encargado` sin `is_staff` es `seller` | `auth/infrastructure/mappers/auth-role.mapper.ts` | F5 (INT-01) | Corregido (`92eef3a`): el rol sale de `user.rol` (cajero/encargado/admin), con respaldo en isadmin/isstaff; `mockLoginAs` envía `rol` |
| H-47 | 🟠 | El alta de usuario no envía `id_sucursal` ni `rol`: el backend crea el usuario sin perfil y ese usuario no puede operar (`El usuario no tiene una sucursal asignada`). Corregirlo implica ampliar formulario, payload y tests (> 50 líneas) | `admin/.../admin-management.page.*`, `users/infrastructure/mappers/user.mapper.ts` | F5 (INT-09) | Registrado, a decidir con el equipo (`it.todo('H-47')`). Relacionado con H-03 |
| H-48 | 🟠 | `UsersFacade` y la página de administración solo reconocían `Error`: el `HttpErrorResponse` del backend (`{"error": "El nombre de usuario ya existe"}`) se mostraba como "Ocurrió un error inesperado" / "Error, por favor intente de nuevo" | `users/application/facades/users.facade.ts`, `admin-management.page.ts` | F5 (INT-09) | Corregido (`8487b8e`): lee `error`, `detail` y `message` del cuerpo; test de integración en rojo primero |
| H-49 | 🟠 | La app no provee animaciones (`provideAnimations`) pero el toast usa `@toastAnimation`: cada toast lanzaba `NG05105` en consola y el toast de error de una venta rechazada salía **sin texto** en el navegador real (Jest no lo detectaba) | `app.config.ts`, `shared/ui/components/toast/toast-container.component.ts` | F6 (`sales.pos`) | Corregido (`00ff06c`): `provideAnimations()`; E2E en rojo primero |
| H-50 | 🟡 | Faltan nombres accesibles: la tarjeta de sucursal no tiene rol ni nombre (sus botones «Editar»/«Eliminar» se repiten sin contexto), el botón de quitar del carrito es solo un icono sin `aria-label`, y el botón de la tabla de precios dice «Fixar» (typo) | `branch-card.component.html`, `cart-item.component.html`, `branch-pricing-table.component.html` | F6 | Parcial: corregido en ventas (`fbf7089`, `aria-label` al quitar del carrito); sucursal y «Fixar» quedan para la parte admin |
| H-51 | 🟠 | El icono `Mail` no está en `LucideAngularModule.pick`: la tarjeta de sucursal (con correo) y el formulario de sucursal lanzaban «icon has not been provided» y dejaban de renderizar (tarjetas, título y etiquetas vacías) | `app.config.ts` | F6 (`admin.branches`) | Corregido (`19c8bf9`): E2E en rojo primero |
| H-52 | 🟡 | La tarjeta de producto del POS imprime el precio sin decimales fijos (`$110`, `$50.5`), el carrito y el ticket sí (`$110.00`) | `product-card.component.html` | F6 (`admin.pricing`) | Corregido (`fbf7089`): `number:'1.2-2'` en la tarjeta del POS |
| H-53 | 🟡 | Los formularios de `/admin` (usuario y sucursal) no muestran mensajes de validación: con datos inválidos el envío simplemente no hace nada | `admin-management.page.html` | F6 (`admin.users`) | Registrado |
| H-54 | 🟠 | `/sales` tenía una violación **critical** de axe (`aria-required-children`): el slider de categorías declaraba `role="list"` con botones. Además el smoke a11y de `/sales` no tenía sesión y auditaba el login | `category-slider.component.html`, `e2e/a11y.smoke.spec.ts` | F6 (a11y) | Corregido (`7958963`): `role="group"` + `aria-label` |
| H-55 | 🟡 | Restos de a11y (serious/moderate) en las páginas privadas: `aria-prohibited-attr` del toast (`aria-label` en un `div` sin rol), `color-contrast` en `/sales` y `<main>` anidado (layout + página) | `toast-container.component.ts`, `main-layout.component.html` y páginas | F6 (a11y) | Registrado (el smoke solo falla con critical) |

Observaciones F4 (sin ID): `getActivePrice` recibe 404 del backend cuando no hay precio y lo trata como error aunque el tipo promete `null`; la facade de branch-pricing no actualiza `prices` tras `setBranchPrice`; typo "Fixar" (debe ser "Fijar") en `branch-pricing-table.component.html:61`, no tocado porque ese archivo trae cambios sin commit de `master`.

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

- [x] **H-01:** test que falla → `roleGuard` funcional en `auth/presentation/guards/role.guard.ts` que lee `route.data['roles']` y compara con `SessionStateService.role()`; si no autoriza, redirige a `/sales`.
  - `app.routes.ts`: `data: { roles: [...] }` → `/admin`, `/branches`, `/branch-pricing`: admin · `/inventory-by-branch`, `/manager`: admin, manager.
  - Spec del guard: sin sesión, rol permitido, rol no permitido, ruta sin `data.roles`.
- [x] **H-02:** corregir roles de `/admin` y `/manager/cashiers` en el sidebar + test de `shell/utils/sidebar-filter.utils.ts`.
- [x] **H-03:** aplicar la opción decidida en F0. *(Opción (a) con la limitación registrada en §5.)*
- [x] Resto de 🔴 y 🟠 de la Fase 0, cada uno con su test primero. *(H-08 corregido; H-09 parcial; H-10 pendiente de decisión, ver §5.)*
- [x] Suites de auth, sales y shell en verde.
- [x] Un commit por hallazgo (`fix(auth): restringe rutas por rol (H-01)`).

### Fase 2 — Unitarias Auth
**Sesión:** 1 · **Modelo:** Sonnet · **Subagentes:** no (módulo chico)

- [x] Lote A — domain e infraestructura pura: `domain/entities/user-profile.entity.ts`, `infrastructure/mappers/auth-role.mapper.ts`, `infrastructure/mappers/profile.mapper.ts`, `infrastructure/http/auth-token-http.utils.ts` *(`cfd4ac8`; `user-profile.entity.ts` es solo una interfaz, sin spec propio: lo cubre `profile.mapper.spec.ts`)*
- [x] Lote B — application: `usecase/refresh.usecase.ts`, `usecases/get-my-profile.usecase.ts`, `usecases/update-my-sucursal.usecase.ts`, `commands/login.command.ts` (si tiene validación) *(`0e3eae2`; `login.command.ts` es una interfaz sin validación, sin spec)*
- [x] Lote C — infraestructura HTTP: `repositories/profile-repository.impl.ts` *(`c870f20`)*
- [x] Ampliar specs existentes: *(`eac3cf6` session-state/facade/auth-repository/auth.errors, `b90bc41` y `57c664c` interceptor + orquestador, `7cf66f5` login.page)*
  - `login.page.spec.ts`: recordar sesión, `redirectTo`, errores 401/500/red, botón deshabilitado mientras carga (no doble envío).
  - `session-state.service.spec.ts`: sesión expirada en storage, JSON corrupto, legado → actual, logout limpia ambos storages.
  - `auth-token.interceptor.spec.ts`: no adjunta token a la petición de refresh ni a hosts externos.
- [x] Cobertura `features/auth` ≥ 90 % líneas → §8. *(97.9 %)*

### Fase 3 — Unitarias Ventas
**Sesiones:** 2–3 · **Modelo:** Sonnet · **Subagentes:** sí, 2 en paralelo (A+B y C+D), E en la sesión principal

- [x] **H-10 (previo a los lotes):** sacar lógica de negocio de `sales.page.ts`: revalidación de stock → `SalesCartService.findStockIssue`; payload del ticket → `application/mappers/ticket-print-payload.mapper.ts`; `window.desktop` → puerto `DESKTOP_PORT` (`core/ports/desktop.port.ts`). Tests primero; specs de `sales.page` sin cambios de comportamiento. *(El usuario aprobó pasar de 50 líneas.)*
- [x] Lote A — domain: `sale.entity`, `sale-detail.entity`, `detailed-sale.entity`, `payment-method.entity`, `sale-ticket.entity`, `value-objects/sale-date.value`, `product-types/domain/entities/product-type.entity`
- [x] Lote B — mappers: `sale.mapper`, `sale-detail.mapper`, `detailed-sale.mapper`, `payment-method.mapper`, `sale-ticket.mapper`, `product-types/.../product-type.mapper`
- [x] Lote C — use cases: `create-sale`, `create-sale-detail`, `create-complete-sale` (unit; ya existe integración), `update-sale`, `update-sale-detail`, `delete-sale`, `delete-sale-detail`, `get-sales`, `get-sale-detail`, `get-sale-details`, `get-sale-ticket`, `get-payment-methods`, `product-types/*` (4), `strategies/sales-search.strategy`
- [x] Lote D — infraestructura: `payment-method-repository.impl`, `sale-detail-repository.impl`, `product-type-repository.impl`, `utils/http-error-resolver`
- [x] Lote E — facades y presentation (sesión principal, depende de A–D): *(`d02a92b`, `54fc3a3`, `5a6053d`, `a7a57d4`)*
  - `product-types.facade`
  - Componentes nuevos: `cart-item`, `cart-panel`, `product-grid`, `quantity-control`, `sales-summary`
  - Ampliar los `*.functional.spec.ts` existentes: `category-slider`, `payment-method-selector`, `product-card`, `ticket-modal`, `sales.page` (búsqueda por código de barras, cargar más, cliente, cobro sin método de pago, carrito vacío)
  - `sales-cart.service.spec.ts`: límite de stock, cantidad 0 o negativa, subtotal/IVA/total con decimales
- [x] Cobertura `features/sales` ≥ 85 % líneas → §8. *(96.2 %)*

### Fase 4 — Unitarias Rol Admin
**Sesiones:** 1–2 · **Modelo:** Sonnet · **Subagentes:** sí, 2 en paralelo (branches + users | branch-pricing + admin)

- [x] **branches:** `branch.entity`, `branch.mapper`, `branch-repository.impl`, 5 use cases (`create`, `update`, `delete`, `get-branches`, `get-branch-by-id`), `branches.facade`, `branch-card`, `branch-form-dialog` (validaciones), `branches.page`
- [x] **branch-pricing:** `branch-price.entity`, `price-history-item.entity`, `branch-price.mapper`, `branch-price-repository.impl`, 4 use cases (`set-branch-price`, `get-active-price`, `get-price-history`, `deactivate-price`), `branch-pricing.facade`, `branch-pricing-table`, `set-price-dialog` (precio negativo, cero, decimales, vacío), `branch-pricing.page`
- [x] **users:** `user.entity`, `user.mapper`, `user-repository.impl`, 4 use cases (`create`, `update`, `delete`, `get-users`)
- [x] **admin:** `admin-management.page` según la decisión H-03 *(spec de F1 ampliado de 7 a 27 tests)*
- [x] Cobertura por módulo → §8 (metas de §1). *(100 % líneas en los 4)*

### Fase 5 — Integración
**Sesiones:** 1–2 · **Modelo:** Sonnet · **Subagentes:** no (necesita contexto entre módulos)

Ya existen: `auth-flow`, `sale-auth`, `create-complete-sale`, `sales-facade`, `sales-page`. Agregar:

- [x] INT-01 Login → perfil → cambio de sucursal (use cases + repos + `HttpTestingController`).
- [x] INT-02 Refresh concurrente: dos peticiones reciben 401 a la vez → un solo refresh → ambas se reintentan. Si el refresh falla → sesión limpia y redirección a login.
- [x] INT-03 Logout limpia storage persistente y en memoria; el guard bloquea después.
- [x] INT-04 Router + `authGuard` + `roleGuard`: sin sesión → `/login?redirectTo=…`; seller → `/admin` redirige; admin entra a `/admin`, `/branches`, `/branch-pricing`; manager entra a `/inventory-by-branch` pero no a `/branches`.
- [x] INT-05 Venta completa donde falla un detalle: verificar qué pasa con la venta ya creada (¿se borra o queda huérfana?). Candidato a hallazgo 🔴.
- [x] INT-06 El total, IVA y detalles del carrito coinciden con el payload enviado al backend.
- [x] INT-07 Branches: CRUD facade + repo; la lista se refresca tras crear/editar/borrar; errores 400/409 visibles.
- [x] INT-08 Branch pricing: fijar precio → aparece en historial → es el precio activo; desactivar.
- [x] INT-09 Users: CRUD use cases + repo (+ admin page si se conectó en H-03).

### Fase 6 — E2E (Playwright con mocks)
**Sesiones:** 2 · **Modelo:** Sonnet · **Subagentes:** no (comparten `ng serve`)

- [x] Helpers en `e2e/helpers/backend.ts`: `mockLoginAs(page, role)` y `mockApi(page, ruta, body, status?)`; fixtures de productos, sucursales, precios y usuarios en `e2e/fixtures/`.
- [x] `e2e/auth.session.spec.ts`: SIS-004, SIS-005, SIS-006.
- [x] `e2e/sales.pos.spec.ts`: SIS-010 a SIS-016.
- [x] `e2e/admin.access.spec.ts` — **SIS-053 (nuevo)**: seller no ve ni entra a `/admin`, `/branches`, `/branch-pricing`; admin sí; manager solo a lo suyo.
- [x] `e2e/admin.branches.spec.ts`: SIS-030.
- [x] `e2e/admin.pricing.spec.ts`: SIS-023.
- [x] SIS-050 usuarios (`e2e/admin.users.spec.ts`, según H-03; el caso de «quitar permiso de reportes» no existe en la UI, H-47).
- [x] Agregar `/sales`, `/branches` y `/branch-pricing` a `e2e/a11y.smoke.spec.ts` (SIS-061).
- [ ] Opcional (no hecho; `auth.real.spec.ts` ya existe y se omite sin `E2E_REAL`): 1 smoke contra el backend real (`*.real.spec.ts` + `wakeBackend()`).

### Fase 7 — Cierre y evidencia
**Sesión:** 1 · **Modelo:** Sonnet · **Subagentes:** no

- [x] `coverageThreshold` por carpeta en `jest.config.js` con las metas de §1 (`'./src/app/features/auth/': { lines: 90, … }`).
- [x] `npm run test:coverage` y `npm run e2e` en verde.
- [x] Análisis Sonar: **no ejecutado** (ver §8, «Resultado final»).
- [x] Agregar SIS-053 a `docs/casos-sistema.md` y enlazar este plan desde `docs/plan-pruebas.md`.
- [x] Tabla final para la tesis en §8: tests por nivel y módulo, cobertura antes/después, hallazgos corregidos.
- [x] `graphify update .`

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
| SIS-050 | Usuarios y roles | INT-09 | `admin.users` |
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

### Cobertura de auth tras la Fase 2

| Módulo | Suites | Tests | Líneas | Ramas | Funciones |
|---|---|---|---|---|---|
| auth | 21 / 0 fallan | 156 + 3 `todo` | 97.9 % (430/439) | 92.9 % (92/99) | 92.2 % (95/103) |

Antes (F0): 84.2 % líneas, 63.7 % ramas, 70.0 % funciones, 11 suites. El 2.1 % de líneas restante incluye `index.ts` y `auth.routes.ts` (re-exports/rutas, 0 %, excluidos por §1) y la línea 53 del orquestador. Proyecto completo: 102/102 suites, 772 tests + 3 `todo`. Mismo comando de §3.1.

### Cobertura de ventas tras la Fase 3

| Módulo | Suites | Tests | Líneas | Ramas | Funciones |
|---|---|---|---|---|---|
| sales (incluye `product-types`) | 57 / 0 fallan | 565 + 8 `todo` | 96.2 % (923/959) | 94.1 % (191/203) | 94.0 % (264/281) |

Antes (F0): 78.8 % líneas, 58.2 % ramas, 66.2 % funciones, 17 suites. Mismo comando de §3.1 cambiando la ruta a `features/sales` y excluyendo también `index.ts` y `*.routes.ts`. Proyecto completo: 143/143 suites, 1154 tests + 11 `todo`. Lo único bajo la meta es `sales.facade.ts` (80 % líneas, líneas 118-151 y 159-163: update/delete de ventas y detalles, no usados por la UI) y el stub `refounds.page.ts` (0 %, excluido por §1).

### Cobertura de los módulos admin tras la Fase 4

| Módulo | Líneas | Ramas | Funciones | Meta líneas |
|---|---|---|---|---|
| admin | 100 % (39/39) | 100 % (6/6) | 100 % (10/10) | ≥ 80 % ✅ |
| branches | 100 % (172/172) | 100 % (38/38) | 100 % (53/53) | ≥ 80 % ✅ |
| branch-pricing | 100 % (176/176) | 92.9 % (26/28) | 100 % (51/51) | ≥ 85 % ✅ |
| users | 100 % (73/73) | 100 % (4/4) | 100 % (23/23) | ≥ 80 % ✅ |

Antes (F0): 0 % en branches, branch-pricing y users; admin 0 % (la página era maqueta, hoy 39 líneas tras H-03). Los 4 módulos juntos: 29 suites, 298 tests + 9 `todo`. Proyecto completo: 170/170 suites, 1441 tests + 20 `todo`. Mismo comando de §3.1 con `{branches,branch-pricing,users,admin}` y excluyendo `index.ts` y `*.routes.ts`. Las entidades de los 4 módulos son solo interfaces (sin spec). Solo 2 ramas de `branch-pricing` quedan sin cubrir.

### Integración tras la Fase 5

| INT | Archivo | Tests |
|---|---|---|
| 01-03 | `auth/application/facades/auth-session.integration.spec.ts` | 13 |
| 04 | `app.routes.integration.spec.ts` (tabla real de `app.routes.ts` con stubs de página) | 30 |
| 05 | `sales/application/usecase/create-complete-sale.integration.spec.ts` | 9 |
| 06 | `sales/presentation/state/sales-cart.integration.spec.ts` | 7 (H-40 convertido en test real) |
| 07 | `branches/presentation/pages/branches-page/branches.page.integration.spec.ts` | 10 |
| 08 | `branch-pricing/presentation/pages/branch-pricing-page/branch-pricing.page.integration.spec.ts` | 8 + 2 todo (H-44, H-45) |
| 09 | `admin/presentation/pages/admin-management/admin-management.page.integration.spec.ts` | 8 + 1 todo (H-47) |

85 tests de integración nuevos (más 1 de H-43 en `sales-page.integration.spec.ts` y 1 en `login.page.spec.ts`). `npm run test:integration` equivalente (`--testPathPattern integration.spec`): 16 suites, 147 tests + 5 todo. Proyecto completo: 176/176 suites, 1516 tests + 25 `todo`. Contratos verificados contra `RefaccionariaBack` (Develop, `pull --ff-only` al día): ventas (`crear_venta_completa`, `ventas.anular`, rename `id_metodo_pago`), sucursales, `precios-sucursal`, `users`, login.

### E2E tras la Fase 6

| Archivo | Casos | Tests |
|---|---|---|
| `e2e/auth.session.spec.ts` | SIS-004, SIS-005, SIS-006 | 7 |
| `e2e/sales.pos.spec.ts` | SIS-010 a SIS-016 | 11 (H-40 convertido en test real) |
| `e2e/admin.access.spec.ts` | SIS-053 (nuevo) | 20 |
| `e2e/admin.branches.spec.ts` | SIS-030 | 5 |
| `e2e/admin.pricing.spec.ts` | SIS-023 | 4 |
| `e2e/admin.users.spec.ts` | SIS-050 | 5 |
| `e2e/a11y.smoke.spec.ts` | SIS-061 (`/sales`, `/branches`, `/branch-pricing` añadidas) | +3 |

54 tests E2E nuevos con mocks (`page.route` contra el host de la API, sin Render) + 1 `fixme`. Proyecto completo `npx playwright test --project=chromium`: 60 pasan, 3 omitidos (el `fixme` y los 2 de `auth.real`, que requieren `E2E_REAL`). Adaptaciones: la UI no ofrece «recordar sesión» (H-19), así que las rutas privadas se cargan sembrando `localStorage` con `seedSession`; «Efectivo» se preselecciona en el POS (SIS-012 usa un catálogo de pagos sin efectivo); sin sucursal asignada no hay catálogo (SIS-013).


### Sesiones

| Fecha | Fase | Modelo | Hecho | Hallazgos nuevos | Pendiente |
|---|---|---|---|---|---|
| 2026-11-13 | F0 | Opus | Rama `test/admin-auth-ventas` creada (cambios previos de `master` fuera, sin commit); línea base Jest + cobertura + E2E; auditoría seguridad/arquitectura/bugs; H-03 = (a); H-05 y H-07 cerrados | H-08 🔴 doble venta si falla el ticket · H-09 🟠 rollback parcial · H-10 🟠 lógica en `sales.page` · H-11 a H-18 🟡/⚪ | F1: H-01, H-02, H-03 (a), H-08, H-10 (si ≤ 50 líneas) |
| 2026-11-13 | F1 | Sonnet | H-08 `ff5a3ed` · H-01 `f01f164` · H-02 `d3dc434` · H-03 `fd879e5` · H-09 parcial `62e5e73`. Cada uno con su test rojo primero. Suites auth + sales + shell + admin + users en verde (`37 suites, 265 tests + 1 todo`) | Ninguno | H-10 (decisión del usuario, >50 líneas); H-09 cascada/stock con el backend (F5 INT-05); F2 |
| 2026-11-13 | F2 | Sonnet | Lotes A `cfd4ac8`, B `0e3eae2`, C `c870f20`; ampliaciones `eac3cf6` (session-state, facade, auth-repository, auth.errors), `7cf66f5` (login.page); fixes H-21 `b90bc41` y H-22 `57c664c` (test rojo primero). auth: 11 → 21 suites, 84.2 % → 97.9 % líneas. Proyecto: 102/102 suites en verde | H-19 🟡 sin casilla "recordar" · H-20 🟡 `onSubmit` sin guarda de `loading` · H-21 🔴 fuga del access token (corregido) · H-22 🟠 login incorrecto enmascarado (corregido) | F3: ventas. Pendiente decidir H-18/H-19/H-20 (🟡, `it.todo`) y H-10 |
| 2026-11-13 | F3 | Sonnet (+2 subagentes Sonnet) | H-10 `84225fb` (revalidación de stock → `SalesCartService.findStockIssue`, payload → `application/mappers/ticket-print-payload.mapper`, `window.desktop` → `DESKTOP_PORT`; tests primero). Lote A `3c17ea4` (domain + `order.entity.money.spec`), B `0f72fc5` (mappers), C `481a16b` (use cases + estrategia), D `62c0d20` (repos HTTP + `http-error-resolver`), E `d02a92b`, `54fc3a3`, `5a6053d`, `a7a57d4` (facade de tipos, 5 componentes nuevos, ampliación de ticket-modal / category-slider / payment-method-selector / product-card / sales.page / sales-cart). sales: 17 → 57 suites, 78.8 % → 96.2 % líneas | H-23 a H-29 🟡 (descuento NaN, tope 999, `Date.parse` laxo, total `""`→0, mensajes fijos en mutaciones, id 0 en fallback, contrato sync/async); H-12 acotado a cantidades fraccionarias; H-10 corregido | F4: roles admin. Pendiente: reusar mapper y `DESKTOP_PORT` en `ticket-modal.component.ts` (tiene cambios sin commit de `master`); `sales.facade.ts` 80 % líneas |
| 2026-11-13 | F4 | Sonnet (+2 subagentes Sonnet) | Specs de `branches` `52c688c` (11 suites), `users` `9f8e6f4` (6 specs + `users.facade` ampliado), `branch-pricing` + `admin` `ee15cca` (admin 7 → 27 tests); fix H-33/H-34/H-35 `baa5b61` (rojo primero). Los 4 módulos 0 % → 100 % líneas; proyecto 170/170 suites en verde | H-30 a H-32 🟡 (form de sucursal sin topes ni trim) · H-33 🔴 tabla de precios no cargaba (NG0600, corregido) · H-34 🟠 error silenciado (corregido) · H-35 🟠 tabla no recargaba (corregido) · H-36 🟡 `NaN` en mapper · H-37 🟡 `deactivatePrice`/`update`/`delete` sin consumidor · H-14 ampliado (tope y NaN) | F5: integración. Pendiente decidir H-14, H-30 a H-32, H-36, H-37 (🟡, `it.todo`). Typo "Fixar" y reuso de mapper en `ticket-modal` siguen fuera por cambios de `master` |
| 2026-11-13 | F5 | Sonnet | INT-01 a INT-03 `be03f70`, INT-04 `2702dfd`, INT-05 + fix H-38/H-39 `e6a86eb`, INT-06 `7a11383`, INT-07 + fix H-42/H-43 `ea9eb54`, INT-08 `292eecf`, INT-09 + fix H-48 `8487b8e`, fix H-43 login y POS `429a0bc`. Cada fix con su test en rojo primero. 176/176 suites en verde | H-38 🔴 `id_metodoPago` vs `id_metodo_pago` (corregido) · H-39 🔴 rollback imposible para el cajero, venta huérfana (corregido, POST atómico; resuelve H-09) · H-40 🔴 total con IVA ≠ total del ticket (sin corregir: decisión de negocio; cierra H-13) · H-41 🟠 backend devuelve sucursales sin nombre/teléfono · H-42 🟠 y H-48 🟠 mensajes del backend ignorados (corregidos) · H-43 🟠 toasts de error nunca visibles por NG0600 (corregido en login, POS y sucursales) · H-44 a H-46 🟡 · H-47 🟠 alta de usuario sin sucursal/rol | Decidir H-40 (¿precio con IVA?), H-41 y H-47 (backend/UX), H-43 en clients, suppliers e inventory-by-branch, confirmar versión del backend desplegada (H-38); H-14, H-30 a H-32, H-36, H-37, H-44 a H-46 (🟡, `it.todo`). F6: E2E |
| 2026-11-13 | F6 | Sonnet | Helpers `mockLoginAs`/`mockApi`/`loginAs`/`seedSession` + fixtures `api-data.ts`; `auth.session` (7) `7e3527e`, `sales.pos` (10 + 1 fixme) + fix H-49 `00ff06c`, `admin.access` (20) `0e3086d`, `admin.branches` (5) + fix H-51 `19c8bf9`, `admin.pricing` (4) `9f3a282`, `admin.users` (5) `0648cef`, a11y +3 rutas + fix H-54 `7958963`. Suite completa `playwright --project=chromium`: 60 pasan, 3 omitidos. Jest 176/176 | H-49 🟠 sin `provideAnimations` (corregido) · H-50 🟡 nombres accesibles · H-51 🟠 icono `Mail` (corregido) · H-52 🟡 · H-53 🟡 · H-54 🟠 `role=list` critical (corregido) · H-55 🟡 | `test.fixme` H-40 (decisión de negocio); smoke real opcional sin hacer; decidir H-50, H-52, H-53, H-55 (🟡). F7: cierre |
| 2026-11-14 | Menores (parte A: ventas y auth) | Sonnet | H-40/H-13 `d9577ec` · H-12/H-23/H-24 `5ff094a` · H-25 `3af93bc` · H-26/H-28 `121187b` · H-29 `af93d1e` · H-27 `c332418` · H-11 `162f51f` · H-52/H-50 (carrito) `fbf7089` · H-17 `893ea45` · H-06 `3690215` · H-46 `92eef3a` · H-16 `b22b4d6` · H-18/H-19/H-20 `54e58e9` · ajuste e2e `831a31d`. Tests rojos primero. Jest 177/177 en verde | H-40 decidido (el precio incluye IVA) y corregido; H-04 riesgo aceptado | Parte B (admin): H-50 en sucursales y «Fixar», H-53, H-55 |

### Resultado final (Fase 7)

| Módulo | Unit | Integración | E2E | Líneas antes → después | Hallazgos corregidos |
|---|---|---|---|---|---|
| auth | 118 | 13 (INT-01 a 03) | 7 (`auth.session`) + 4 (`auth.login`) | 84.2 % → 99.8 % (435/436) | H-21 🔴, H-22 🟠, H-43 🟠 (login) |
| sales | 518 | 17 (INT-05, INT-06, `sales-page`) | 10 (`sales.pos`) + 1 `fixme` (H-40) | 78.8 % → 95.6 % (907/949) | H-08 🔴, H-38 🔴, H-39 🔴 (resuelve H-09), H-10 🟠, H-43 🟠 (POS), H-49 🟠 |
| rol admin (admin, branches, branch-pricing, users + acceso) | 294 | 56 (INT-04 = 30, INT-07 a 09 = 26) | 34 (`admin.access` 20, `.branches` 5, `.pricing` 4, `.users` 5) + 3 en `a11y.smoke` | 0 % → 95.3 % (465/488) | H-01 🔴, H-02 🟠, H-03 🟠, H-33 🔴, H-34 🟠, H-35 🟠, H-42 🟠, H-43 🟠 (sucursales), H-48 🟠, H-51 🟠, H-54 🟠 |

Jest completo con cobertura (`npm run test:coverage`, 2026-11-13): **176/176 suites, 1516 tests en verde + 25 `todo`**; global 83.7 % líneas, 85.2 % ramas, 79.5 % funciones, 83.8 % statements. Los conteos de tests por módulo son `it(` de los specs de cada carpeta (aprox.; `unit` = total − integración). Playwright `--project=chromium`: **60 pasan, 3 omitidos** (el `fixme` de H-40 y 2 de `auth.real`, que requieren `E2E_REAL`). Total: 19 hallazgos 🔴/🟠 corregidos, cada uno con su test en rojo primero.

Cobertura por módulo contra `coverageThreshold` (`jest.config.js`, commit `a275ef1`; líneas = meta de §1, resto = logrado redondeado hacia abajo):

| Módulo | Líneas (meta) | Statements | Ramas | Funciones |
|---|---|---|---|---|
| auth | 99.8 % (≥ 90) | 99.6 % | 94.9 % | 95.0 % |
| sales | 95.6 % (≥ 85) | 95.7 % | 94.6 % | 91.7 % |
| admin | 100 % (≥ 80) | 100 % | 81.8 % | 100 % |
| branches | 95.0 % (≥ 80) | 95.5 % | 100 % | 100 % |
| branch-pricing | 95.7 % (≥ 85) | 96.1 % | 96.4 % | 100 % |
| users | 92.6 % (≥ 80) | 93.6 % | 100 % | 100 % |

Estas cifras incluyen `index.ts` y `*.routes.ts` (la base de F0 los excluía), por eso difieren unas décimas de las tablas de fases.

**Sonar: no ejecutado.** No hay `sonar-scanner` instalado (`which sonar-scanner` vacío) ni servidor configurado en `sonar-project.properties` (solo `projectKey`, sin `sonar.host.url`). No se instaló nada. El reporte `coverage/lcov.info` queda listo para `sonar.javascript.lcov.reportPaths`. Pendiente: correr el análisis donde esté el servidor y anotar los issues bloqueantes de estos módulos.

### Decisiones pendientes para el usuario

- **H-40** 🔴: **decidido por el usuario: el precio de venta ya incluye IVA.** Corregido (`d9577ec`): total = Σ(precio × cantidad) − descuento (igual que el backend), subtotal = total/1.16 e IVA = total − subtotal, al centavo; el ticket de Electron desglosa el IVA como incluido. Cierra H-13.
- **H-41** 🟠 (backend): `GET /sucursales/` devuelve solo `{id, ubicacion}`, sin nombre ni teléfono.
- **H-47** 🟠: el alta de usuario no envía sucursal ni rol (backend/UX).
- **H-43** 🟠 en módulos de otros integrantes: `clients`, `suppliers` e `inventory-by-branch` (toasts de error dentro de `effect()` que nunca se muestran, NG0600). Corregido solo en login, POS y sucursales.
- **H-38**: confirmar que Render tenga desplegada la versión del backend con `id_metodo_pago` y `crear_venta_completa`.
- **Sonar**: ejecutarlo donde haya servidor y revisar bloqueantes.
- **🟡 abiertos** (`it.todo` o solo registrados): H-14, H-15, H-30 a H-32, H-36, H-37, H-44, H-45, H-53, H-55 (la parte de ventas y auth de los menores se corrigió: ver §5; H-04 queda como riesgo aceptado).
