# Plan Maestro de Pruebas — FrontTRT

> Frontend: Angular 18.2 + Clean Architecture (`domain / application / infrastructure / presentation`)
> Backend base: `https://refaccionariaback.onrender.com` · API: `https://refaccionariaback.onrender.com/api` (ver `src/env/environment.ts`)
> Targets: Web (`ng serve`) + Desktop (Electron)
> Runners: Jest (unitarias/integración) + Playwright (sistema/a11y) + Maze/Clarity (usabilidad)
>
> Nota Render gratuito: el servidor se duerme sin actividad y tarda 30-60s en despertar
> (cold-start). Los E2E P0 usan mocks y no dependen de Render (ver `e2e/helpers/backend.ts`).
> Las suites contra backend real deben usar `wakeBackend()` + timeouts 60-90s + `retries: 2` en CI.

---

## 1. Objetivos

1. Evitar regresiones en flujos críticos: **login → venta → inventario → reportes**.
2. Elevar cobertura real de ~11% archivos (43 specs / 378 .ts) a **≥70% líneas, ≥65% funciones, ≥60% branches** en 3 fases.
3. Automatizar sistema E2E para Web y reutilizarlo en Electron.
4. Validar usabilidad con usuarios reales de mostrador/almacén/administración antes de cada release.
5. Dejar evidencia auditable: reportes Jest + Playwright HTML + Allure (opcional) + actas SUS.

## 2. Alcance

### 2.1 Dentro del alcance

| Capa / Módulo | Qué se prueba |
|---|---|
| `features/auth` | login, guard, refresh-token-orchestrator, interceptors, session-state, facades |
| `features/sales` | carrito (add/increase/decrease/remove), subtotal/IVA/total, confirmSale, facades, repositories |
| `features/inventory`, `inventory-by-branch`, `branch-pricing` | CRUD, asignación por sucursal, precios por sucursal |
| `features/branches, clients, suppliers, users` | CRUD + validaciones + paginación/búsqueda |
| `features/reports, sales-history, notifications, admin, manager` | filtros, listados, permisos por rol |
| `core/http, interceptors, logging, storage, utils` | retry/backoff, manejo de errores, logger, sanitizers, jwt |
| `shared/ui`, `shell` | button, input, dropdown, toast, search-input, navbar, sidebar, layouts |
| Transversal | routing + guards, responsive, accesibilidad WCAG 2.2 AA básica, performance de POS |

### 2.2 Fuera del alcance (esta fase)

- Pruebas de carga/estrés del backend (corresponde al repo back).
- Seguridad pentest (solo se valida manejo frontend: no exponer tokens, sanitizar URLs, redirección segura).
- Migraciones de datos.

## 3. Estrategia por niveles (pirámide)

```
        / Usabilidad (5 tareas + SUS, manual, cada release) \
       / Sistema E2E Playwright (~35 casos, CI en PR)      \
      / Integración Jest + HttpTestingController (~60)     \
     / Unitarias Jest + Testing Library + ng-mocks (~250) \
```

| Nivel | Herramienta | Dónde vive | Cuándo corre |
|---|---|---|---|
| Unitaria | `jest`, `jest-preset-angular`, `@testing-library/angular`, `@testing-library/user-event`, `ng-mocks` | `src/**/*.spec.ts` | cada commit (`npm test`) |
| Integración | `jest` + `provideHttpClientTesting` + `HttpTestingController` + `RouterTesting` | `src/**/*.integration.spec.ts` | cada PR (`npm run test:integration`) |
| Sistema | `@playwright/test` + `@axe-core/playwright` | `e2e/**/*.spec.ts` | cada PR + nightly + pre-release (`npm run e2e`) |
| Usabilidad | `Maze/Useberry` + `Microsoft Clarity` + guion SUS | `docs/protocolo-usabilidad.md` | cada release menor/mayor |

**Por qué este stack:**
- No se migra de Jest: ya está configurado y es estándar Angular 18+.
- Testing Library evita tests acoplados a implementación (menos mantenimiento que TestBed pelado).
- `ng-mocks` simplifica mocks de Clean Architecture (1 línea vs stubs manuales).
- Playwright > Puppeteer/Cypress aquí porque cubre Web + Electron con mismo código, tiene auto-wait, traces y video (Puppeteer actual es muy bajo nivel y flaky).

## 4. Matriz de priorización (riesgo × uso)

| Prioridad | Módulos | Motivo | Cobertura objetivo |
|---|---|---|---|
| **P0 crítico** | auth (login/guard/refresh), sales (carrito/cobro), core/http-error + retry | Si falla, no hay venta | 90%+ unit + 100% casos sistema |
| **P1 alto** | inventory, inventory-by-branch, branch-pricing, branches | Stock/precio erróneo = pérdida dinero | 80%+ |
| **P2 medio** | clients, suppliers, sales-history, reports | Operación diaria, menor impacto inmediato | 70%+ |
| **P3 bajo** | notifications, admin, manager, shell, shared/ui | Soporte/cosmético | 60%+ |

Orden de ejecución recomendado: P0 → P1 → P2 → P3.

## 5. Criterios

### 5.1 Entrada (para iniciar un ciclo)
- Build `ng build` en verde.
- `npm test` sin fallos en P0.
- Ambiente E2E disponible (`http://localhost:4200` o preview) + usuario seed por rol (admin, vendedor, almacén).
- Datos seed: ≥10 productos, 2 sucursales, 2 métodos de pago, 1 inventario asignado.

### 5.2 Salida (para liberar)
- 100% casos P0 sistema en verde, ≥95% P1, ≥90% global.
- Cobertura Jest ≥ umbrales (`jest.config.js`: lines 70, functions 65, branches 60).
- 0 defectos bloqueadores/críticos abiertos. Los menores con workaround documentado.
- A11y Playwright: 0 violaciones críticas en login y ventas (serious se reportan como deuda hasta §10.5).
- SUS usabilidad ≥78 (o mejora +5 pts vs baseline).

### 5.3 Suspensión / reanudación
Suspender si: caída de backend seed, build roto, >30% E2E fallando por causa ambiental. Reanudar tras fix + re-run completo P0.

## 6. Ambientes y datos

| Ambiente | Uso | URL / comando |
|---|---|---|
| Local dev | unitarias/integración | `npm test`, `npm run test:coverage` |
| E2E local | sistema | `npm run e2e` (levanta `ng serve` solo) |
| E2E CI | regresión PR | Playwright + `BASE_URL` del preview |
| Electron | smoke escritorio | `npm run electron:dev` + spec `e2e/electron.smoke.spec.ts` (fase 2) |

### 6.1 Usuarios seed (DB de pruebas, solo test)

| Usuario | Sucursal | Uso en pruebas |
|---|---|---|
| `ana.centro` | 1 Centro CDMX | POS Centro, flujo feliz (SIS-010), smoke real por defecto |
| `carlos.centro` | 1 Centro CDMX | Sesiones paralelas, colisiones |
| `gerente.general` | 1 Centro CDMX | Permisos elevados, reportes, precios |
| `maria.norte` | 2 Norte Monterrey | POS Norte, precio diferenciado (SIS-023) |
| `jorge.norte` | 2 Norte Monterrey | Segundo usuario Norte |
| `luis.sur` | 3 Sur Puebla | POS Sur, inventario por sucursal (SIS-022) |
| `sofia.sur` | 3 Sur Puebla | Segunda usuaria Sur |
| `admin_neon` | — (sin perfil) | Empty-state sin sucursal (SIS-013) |
| `vendedor1` | — (sin perfil) | Guard + empty-state sin sucursal |

Credenciales en `e2e/fixtures/test-users.ts` (cuentas de test desechables).
Deben existir en el backend al que apunta el front (`environment.ts`); si un login
real da 401, ese ambiente no tiene el seed → crearlo vía `POST /api/users` con `id_sucursal`.
Nunca usar credenciales reales/productivas en specs.

## 7. Gestión de defectos

Severidad: `Bloqueador > Crítico > Mayor > Menor > Cosmético`.
Flujo: detectar (Jest/Playwright/Maze) → reportar con trace/video + pasos → corregir → re-test P0 → cerrar con evidencia.
Etiquetar por módulo (`auth`, `sales`, ...) y nivel (`unitaria`, `sistema`, `usabilidad`).

## 8. Fases y entregables

**Fase 1 (esta entrega, hecha):**
- [x] Instalar `testing-library/angular, user-event, jest-dom, ng-mocks, playwright, axe-core/playwright, allure-playwright`
- [x] `playwright.config.ts` (timeouts cold-start), scripts `test:*`, `e2e*`, `a11y`, umbrales Jest en baseline
- [x] Este plan + `docs/casos-sistema.md` + `docs/protocolo-usabilidad.md`
- [x] Ejemplos ejecutables + helpers + fixtures de usuarios seed (ver §9)

**Fase 2 (siguiente, P0+P1):**
- [x] Login cerrado (Fase 1): 12 suites Jest auth en verde + E2E mocks 4/4 + smoke real 2/2.
- Completar unitarias/integración sales + core/http (8 suites en rojo pre-existente, ver §11).
- Automatizar SIS-010…SIS-016 y resto P1 en Playwright.
- Primera ronda usabilidad (5 usuarios mostrador).

**Fase 3 (P2+P3 + endurecimiento):**
- Inventario/sucursales/clientes/proveedores/reportes.
- A11y completa + visual regression (Argos/Percy opcional).
- Electron E2E + CI nightly.

## 9. Ejemplos de referencia creados

| Tipo | Archivo | Qué demuestra |
|---|---|---|
| Unitaria (Testing Library) | `src/app/shared/ui/components/button/button.component.tl.spec.ts` | render + inputs + output + a11y attrs, estilo usuario |
| Integración (HttpTesting + ng-mocks) | `src/app/features/auth/infrastructure/repositories/auth-flow.integration.spec.ts` | facade→usecase→repository→HTTP mockeado |
| Sistema (Playwright, mocks) | `e2e/auth.login.spec.ts` | SIS-001/002/003/004 sin depender de Render |
| Sistema real (Playwright, opt-in) | `e2e/auth.real.spec.ts` | login real ana.centro + empty-state sin sucursal (solo `E2E_REAL=1`) |
| Sistema + A11y | `e2e/a11y.smoke.spec.ts` | axe en login + ventas; falla solo en critical |
| Helpers/fixtures | `e2e/helpers/backend.ts`, `e2e/fixtures/test-users.ts` | mocks, `wakeBackend()`, usuarios seed |

Comandos:
```bash
npm test                          # unitarias + integración (Jest)
npm run test:coverage             # con cobertura + umbrales baseline (§11)
npm run test:integration          # solo *.integration.spec.ts
npm run e2e                       # sistema con mocks (levanta ng serve solo)
npm run e2e:real                  # smoke contra Render (puerto 5173, ver nota CORS §6)
npm run e2e:ui                    # modo UI debug
npm run a11y                      # solo accesibilidad
```

> Nota CORS: el backend solo permite `localhost:5173` y `localhost:3000`, NO `localhost:4200`
> (`RTR/settings.py` — issue B1 reportado al backend). Por eso `e2e:real` sirve el front en
> el puerto 5173. Cuando el backend agregue `4200` (y el origen productivo), el smoke real
> podrá correr en el puerto estándar.

## 10. Riesgos principales

1. Suite Jest con 8 specs en rojo pre-existente (deriva tras sync backend, ver §11) → arreglar en Fase 2 antes de exigir verde total.
2. Backend Render con cold-start (30-60s) → E2E con mocks por defecto; lo real con `npm run e2e:real`,
   `wakeBackend()`, timeouts 60-90s y `retries: 2` en CI. Además falta `localhost:4200` en el CORS
   del backend (issue B1): el dev local contra Render debe servirse en puerto permitido (5173).
3. Solo Chromium instalado ahora → instalar Firefox/WebKit antes de matriz completa.
4. Bug NG0600 en `login.page.ts` (effect escribe signals vía toast) → el toast de error puede no mostrarse; fix con `allowSignalWrites` o `untracked` + cola.
5. A11y `aria-prohibited-attr` en `toast-container` (aria-label en div sin role) → fix con `role="status"`.

## 11. Estado real de la suite (2026-09-14, baseline)

- Jest: 191 passed / 13 failed / 1 todo (45 suites: 37 ok, 8 en rojo pre-existente por deriva
  de contrato: `auth.facade`, `auth-repository`, `sale-repository`, `sales-cart`,
  `dropdown`, `toast-container`, `search-input`, `navbar`. Ej: specs que aún esperan
  `/refresh` cuando el código ya usa `/token/refresh`).
- Cobertura: statements ~31%, branches ~25%, lines ~31%, functions ~24%. Umbrales en
  `jest.config.js` fijados a ese baseline (28/20/28/20); subir a 50 y luego 70 en Fases 2-3.
- Playwright (mocks): 7/7 verde (`auth.login` 4 + `a11y` 3). Sin violaciones axe critical;
  1 serious conocida (`aria-prohibited-attr`, ver §10.5).
- Smoke real (2026-09-14): **2/2 verde** con `npm run e2e:real` (`ana.centro` → `/sales`;
  `admin_neon` sin perfil → empty-state). Causa raíz del fallo inicial: el
  `trailingSlashInterceptor` convertía `POST /api/login` en `/api/login/` y Django
  respondía 404 (el backend define `login` sin slash). Ya corregido en frontend con
  `SKIP_TRAILING_SLASH` (ver `trailing-slash.interceptor.ts`); el backend funciona bien.
  Segundo hallazgo (solo afecta dev local): preflight CORS falla desde `localhost:4200`
  porque no está en `CORS_ALLOWED_ORIGINS` — issue B1 reportado al backend; `e2e:real`
  usa el puerto 5173 (permitido) como workaround.

---
*Mantener este doc vivo: cada release actualiza §4 (cobertura real) y §8 (checklist).*
