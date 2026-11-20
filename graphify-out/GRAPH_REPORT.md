# Graph Report - FrontTRT  (2026-11-20)

## Corpus Check
- 598 files · ~234,378 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2541 nodes · 6962 edges · 139 communities (118 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b777550d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- clients.facade.ts
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- inventory-by-branch.facade.ts
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- sales-page.functional.spec.ts
- Community 15
- client.entity.ts
- app.config.ts
- Branch
- Community 19
- sale-repository.ts
- suppliers.facade.ts
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- permisos.real.spec.ts
- sale-repository.impl.ts
- Community 29
- Community 30
- plan-pruebas.md
- Community 32
- Community 33
- payment-method.mapper.ts
- Community 35
- product-repository.impl.ts
- PaginatedResponse
- Community 38
- Community 39
- inventory-by-branch.facade.ts
- admin.real.spec.ts
- branch-repository.impl.ts
- notifications.facade.ts
- Community 44
- notification-repository.impl.ts
- login.page.ts
- MovementListComponent
- Community 48
- Community 49
- InventoryFacade
- SessionStateService
- sales-history.page.ts
- Branch
- Community 54
- ButtonComponent
- branch-form-dialog.component.ts
- MovementFormDialogComponent
- payment-method.mapper.ts
- AdminManagementPageComponent
- branch-form-dialog.component.ts
- Community 61
- Community 62
- ContextualLogger
- InventoryFacade
- capturar.mjs
- Community 66
- sale-repository.ts
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- app.component.ts
- clients.facade.ts
- InventoryProductGridComponent
- Protocolo de Usabilidad — FrontTRT
- sale-detail.mapper.ts
- skeleton.component.ts
- MovementListComponent
- SalesHistoryPageComponent
- Plan de Implementación — Sincronización Frontend con Backend (Develop)
- api.ts
- resolveHttpErrorMessage
- NavbarComponent
- Fase 3 — Feature de Notificaciones
- 🪟 Guía para Windows
- Fase 5 — Feature de Inventario por Sucursal
- Contexto tesis frontend FrontTRT — documento de trabajo
- clients.routes.ts
- FrontTRT
- Resumen de cambios en el Backend (Develop)
- Fase 4 — Feature de Sucursales
- 1.2 Apps MODIFICADAS
- Fase 1 — Arreglo de Tipos de Reporte
- Fase 2 — Incluir `codigoSAT` en DTO de Producto
- Archivos a modificar en cada fase
- Fase 1 — Perfil de usuario + sucursal en sesión
- Fase 3 — Productos: limpieza + filtros nuevos
- Fase 4 — Reescritura de Inventario por Sucursal
- Plan de Implementación — Frontend para Cambios del Backend
- Consideraciones de Arquitectura
- Fase 0 — Hotfixes de contrato (desbloqueo inmediato)
- Fase 2 — Re-alineación de Sucursales
- ProductRepositoryImpl
- supplier-repository.impl.ts
- Fase 5 — Ventas: integración con inventario y precios por sucursal
- development
- 3. Casos por módulo
- LoggerService
- ProductGridComponent
- Plan de pruebas E2E de flujos — backend local
- client-create-request.dto.ts
- CLAUDE.md
- local
- BranchPricingTableComponent
- production
- AdminManagementPageComponent
- NotificationsBadgeComponent
- inventory-repository.ts
- inventory.mapper.ts
- cart-item.component.ts
- inventario.real.spec.ts
- plan-pruebas-admin-auth-ventas.md
- ContextualLogger
- UpdateSupplierUseCase
- ContextualLogger
- sales.pos.spec.ts
- plan-pruebas.md
- NotificationItemComponent
- back-e2e.sh
- NotificationsPageComponent
- plan-pruebas.md
- ADMIN / NOTIFICACIONES / SHELL (P3)
- delete-sale.usecase.ts

## God Nodes (most connected - your core abstractions)
1. `LOGGER_PORT` - 56 edges
2. `APP_ENV` - 52 edges
3. `Product` - 50 edges
4. `LoggerService` - 43 edges
5. `SessionStateService` - 43 edges
6. `ToastService` - 43 edges
7. `Client` - 42 edges
8. `LoggerPort` - 39 edges
9. `Branch` - 36 edges
10. `Session` - 32 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branch-pricing/infrastructure/repositories/branch-price-repository.impl.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branch-pricing/presentation/components/branch-pricing-table/branch-pricing-table.component.spec.ts → setup-jest.ts
- `configure()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branches/presentation/pages/branches-page/branches.page.integration.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/clients/presentation/components/client-form-dialog/client-form-dialog.component.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/clients/presentation/components/clients-table/clients-table.component.spec.ts → setup-jest.ts

## Import Cycles
- 1-file cycle: `src/app/app.routes.ts -> src/app/app.routes.ts`

## Communities (139 total, 21 thin omitted)

### Community 0 - "clients.facade.ts"
Cohesion: 0.22
Nodes (11): A, addToCart(), B, CAJEROS, cantidad(), card(), lineaCarrito(), panel() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (39): BranchCreateRequestDto, BranchResponseDto, BranchUpdateRequestDto, BranchesFacade, Injectable, CreateBranchUseCase, Injectable, DeleteBranchUseCase (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (8): ProductFormDialogComponent, ProductFormDialogData, setup(), Component, REPORTS_ROUTES, ProductTypesFacade, Injectable, SALES_ROUTES

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (36): GlobalSearchService, Injectable, GetReportUseCase, Injectable, ReportParams, ReportType, ReportRepository, ReportRepositoryImpl (+28 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (3): SalesCartItem, SalesCartService, Injectable

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (11): CreateClientUseCase, Injectable, DeleteClientUseCase, Injectable, GetClientsUseCase, Injectable, Injectable, UpdateClientUseCase (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (12): HttpErrorHandlerService, Injectable, RETRY_COUNT, RetryStrategyService, RETRY_STRATEGY, Injectable, httpErrorInterceptor(), LOGGER_PORT (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (11): DefaultSearchStrategy, Injectable, SEARCH_STRATEGY, SearchStrategy, GetPaymentMethodsUseCase, Injectable, PaymentMethodRepository, PaymentMethodRepositoryImpl (+3 more)

### Community 8 - "inventory-by-branch.facade.ts"
Cohesion: 0.14
Nodes (16): abrir(), abrirHistorial(), abrirInventario(), abrir(), abrir(), abrirPrecios(), abrir(), crearProveedor() (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (6): A, crearUsuarioApi(), filaUsuario(), idEnBd(), perfilEnBd(), tablaUsuarios()

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (15): extract-i18n, lint, test, builder, architect, prefix, projectType, root (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (37): AppComponent, Component, appConfig, withoutTrailingSlash(), AdminManagementPageComponent, Component, InventoryByBranchPageComponent, Component (+29 more)

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (7): PaginatedResponse, PaginationParams, ProductSearchParams, ProductMapper, ProductRepositoryImpl, Injectable, INVENTORY_ROUTES

### Community 14 - "sales-page.functional.spec.ts"
Cohesion: 0.19
Nodes (11): GetMyProfileUseCase, Injectable, Injectable, UpdateMySucursalUseCase, UserProfile, ProfileRepository, ProfileResponseDto, UpdateSucursalRequestDto (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (34): {
    generateTicket,
    generatePreview,
}, { ipcMain }, registerPrinterIpc(), { app, BrowserWindow, ipcMain }, getSenderWindow(), registerWindowIpc(), { app, BrowserWindow }, createMainWindow() (+26 more)

### Community 16 - "client.entity.ts"
Cohesion: 0.06
Nodes (33): InventoryByBranchFacade, Injectable, NotificationsFacade, Injectable, SupplierCreateRequestDto, SupplierResponseDto, SupplierUpdateRequestDto, setup() (+25 more)

### Community 17 - "app.config.ts"
Cohesion: 0.33
Nodes (3): ButtonComponent, Component, ConfirmDialogData

### Community 18 - "Branch"
Cohesion: 0.25
Nodes (7): isRefreshRequest(), isUnauthorizedError(), withBearerToken(), AuthTokenRefreshOrchestrator, Injectable, AUTH_ENDPOINTS, authTokenInterceptor()

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (30): scripts, a11y, build, build:installer, build:installer:win, build:prod, build:win, e2e (+22 more)

### Community 20 - "sale-repository.ts"
Cohesion: 0.12
Nodes (16): crearCliente(), dialogo(), enBd(), idEnBd(), llenar(), fijar(), limpiarNorte(), preciosNorte() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): dePuntoBajo(), enBd(), entradaPorUi(), idUsuario(), lista(), Notif, P, TIPO (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): ADMIN / NOTIFICACIONES / SHELL (P3), Casos de Prueba del Sistema — FrontTRT (E2E), HISTORIAL / REPORTES (P2), Matriz de automatización sugerida, SIS-030 CRUD sucursales, SIS-031 Alta de cliente con validación, SIS-032 CRUD proveedores, SIS-040 Historial filtra por fecha/sucursal (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (24): devDependencies, allure-playwright, @angular-builders/jest, @angular/compiler-cli, @angular-devkit/build-angular, angular-eslint, @axe-core/playwright, concurrently (+16 more)

### Community 26 - "Community 26"
Cohesion: 0.23
Nodes (6): CreatePaymentMethodPayload, UpdatePaymentMethodPayload, PaymentMethodCreateRequestDto, PaymentMethodResponseDto, PaymentMethodUpdateRequestDto, PaymentMethodMapper

### Community 27 - "permisos.real.spec.ts"
Cohesion: 0.12
Nodes (11): TestUser, ADMIN, ADMIN_MANAGER, Rol, ROLES, RUTAS, USUARIOS, jwtExp() (+3 more)

### Community 28 - "sale-repository.impl.ts"
Cohesion: 0.06
Nodes (23): DetailedSale, DetailedSaleItem, DetailedSaleProps, Order, OrderItem, OrderItemProps, SaleProps, Money (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (10): DropdownHostComponent, Component, DropdownItemComponent, Component, DropdownMenuComponent, Component, IconButtonComponent, Component (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (23): CategorySliderComponent, Component, setup(), CreateProductTypeUseCase, Injectable, DeleteProductTypeUseCase, Injectable, GetProductTypesUseCase (+15 more)

### Community 31 - "plan-pruebas.md"
Cohesion: 0.12
Nodes (19): CreateSaleDetailUseCase, Injectable, DeleteSaleDetailUseCase, Injectable, GetSaleDetailsUseCase, Injectable, Injectable, UpdateSaleDetailUseCase (+11 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (8): provideControlValueAccessor(), BaseFormField, Directive, InputComponent, Component, SearchInputComponent, Component, resolveAriaLabel()

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (36): BranchPriceCreateRequestDto, BranchPriceResponseDto, PriceHistoryResponseDto, BranchPricingFacade, Injectable, DeactivatePriceUseCase, Injectable, GetActivePriceUseCase (+28 more)

### Community 34 - "payment-method.mapper.ts"
Cohesion: 0.25
Nodes (7): cli, schematicCollections, newProjectRoot, projects, $schema, version, @angular/cli

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (17): dependencies, @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser (+9 more)

### Community 36 - "product-repository.impl.ts"
Cohesion: 0.20
Nodes (10): 8. Registro de avance, Cobertura de auth tras la Fase 2, Cobertura de los módulos admin tras la Fase 4, Cobertura de ventas tras la Fase 3, Decisiones pendientes para el usuario, E2E tras la Fase 6, Integración tras la Fase 5, Línea base (Fase 0) (+2 more)

### Community 37 - "PaginatedResponse"
Cohesion: 0.22
Nodes (9): 6. Fases, Fase 0 — Línea base y auditoría, Fase 1 — Correcciones críticas (TDD), Fase 2 — Unitarias Auth, Fase 3 — Unitarias Ventas, Fase 4 — Unitarias Rol Admin, Fase 5 — Integración, Fase 6 — E2E (Playwright con mocks) (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (3): BaseControlValueAccessor, MockControlValueAccessor, Component

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (18): ProductFilter, CreateProductUseCase, Injectable, DeleteProductUseCase, Injectable, GetProductByBarcodeUseCase, Injectable, GetProductByIdUseCase (+10 more)

### Community 40 - "inventory-by-branch.facade.ts"
Cohesion: 0.13
Nodes (9): UpdateSalePayload, SaleCreateRequestDto, SaleResponseDto, SaleUpdateRequestDto, SaleMapper, SaleRepositoryImpl, envStub, Injectable (+1 more)

### Community 41 - "admin.real.spec.ts"
Cohesion: 0.12
Nodes (14): LoginCommand, loginAs(), loginDto(), LoginUseCase, Injectable, buildSession(), now(), AUTH_ROUTES (+6 more)

### Community 43 - "notifications.facade.ts"
Cohesion: 0.28
Nodes (6): NotificationResponseDto, GetNotificationsUseCase, Injectable, Notification, NotificationRepository, NotificationMapper

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (15): build, appId, copyright, directories, files, linux, mac, productName (+7 more)

### Community 45 - "notification-repository.impl.ts"
Cohesion: 0.50
Nodes (3): angular, eslint, tseslint

### Community 46 - "login.page.ts"
Cohesion: 0.20
Nodes (4): LoginPageComponent, fillAndSubmit(), submitButton(), Component

### Community 47 - "MovementListComponent"
Cohesion: 0.11
Nodes (14): InventoryItem, InventoryTableComponent, setup(), Component, CardProduct, InventoryProductCardComponent, setup(), Component (+6 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (3): DropdownComponent, Component, HostListener

### Community 49 - "Community 49"
Cohesion: 0.19
Nodes (8): PaymentMethod, CartPanelComponent, Component, PaymentMethodSelectorComponent, Component, setup(), SalesSummaryComponent, Component

### Community 50 - "InventoryFacade"
Cohesion: 0.17
Nodes (9): ClientCreateRequestDto, ClientResponseDto, ClientUpdateRequestDto, CreateClientPayload, UpdateClientPayload, ClientMapper, texto(), ClientRepositoryImpl (+1 more)

### Community 51 - "SessionStateService"
Cohesion: 0.23
Nodes (6): AppRoutes, routes, SessionStateService, Injectable, authGuard(), roleGuard()

### Community 52 - "sales-history.page.ts"
Cohesion: 0.19
Nodes (3): Product, InventoryPageComponent, Component

### Community 53 - "Branch"
Cohesion: 0.23
Nodes (4): ClientFormDialogComponent, ClientFormDialogData, setup(), Component

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (7): author, description, homepage, main, name, private, version

### Community 55 - "ButtonComponent"
Cohesion: 0.15
Nodes (12): AuthError, InvalidCredentialsError, NetworkAuthError, UnknownAuthError, AuthRepository, LoginCredentials, LoginRequestDto, RefreshTokenRequestDto (+4 more)

### Community 56 - "branch-form-dialog.component.ts"
Cohesion: 0.15
Nodes (8): Client, ClientsTableComponent, setup(), Component, ClientSelectorModalComponent, optionButtons(), optionByText(), Component

### Community 57 - "MovementFormDialogComponent"
Cohesion: 0.19
Nodes (4): MovementFormDialogComponent, MovementFormDialogData, setup(), Component

### Community 58 - "payment-method.mapper.ts"
Cohesion: 0.11
Nodes (18): AppSettingsService, Injectable, SKIP_TRAILING_SLASH, trailingSlashInterceptor(), APP_ENV, SALE_ENDPOINTS, PaymentMethodFetchError, PaymentMethodMutationError (+10 more)

### Community 59 - "AdminManagementPageComponent"
Cohesion: 0.19
Nodes (8): SalesSearchStrategy, Injectable, ProductCardComponent, Component, setup(), IoCallback, SalesProduct, StockIssue

### Community 60 - "branch-form-dialog.component.ts"
Cohesion: 0.20
Nodes (8): DESKTOP_PORT, DesktopPort, DesktopPrintResult, toTicketPrintPayload(), TicketModalComponent, Component, isNotFoundError(), TODO: si se requiere filtro por tipo, InventoryItem debería incluir id_tipo/nomb

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (18): 10. Riesgos principales, 11. Estado real de la suite (2026-09-14, baseline), 1. Objetivos, 2.1 Dentro del alcance, 2.2 Fuera del alcance (esta fase), 2. Alcance, 3. Estrategia por niveles (pirámide), 4. Matriz de priorización (riesgo × uso) (+10 more)

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (3): JwtUtils, LoginResponseDto, SessionMapper

### Community 63 - "ContextualLogger"
Cohesion: 0.19
Nodes (6): DeleteNotificationUseCase, Injectable, MarkAllNotificationsReadUseCase, Injectable, MarkNotificationReadUseCase, Injectable

### Community 64 - "InventoryFacade"
Cohesion: 0.15
Nodes (4): AuthFacade, Injectable, ClientsPageComponent, Component

### Community 65 - "capturar.mjs"
Cohesion: 0.38
Nodes (5): IMG, ir(), paso(), settle(), shot()

### Community 77 - "clients.facade.ts"
Cohesion: 0.12
Nodes (14): 1. Alcance, 2.1 Reglas de ahorro, 2.2 Prompt para abrir cada sesión, 2.3 Prompt para un subagente (lotes de Fases 3 y 4), 2.4 Estimado, 2. Cómo ejecutar este plan (costo con plan Pro de $20), 3.1 Archivos y comandos, 3.2 Specs de referencia (copiar estilo, no reinventar) (+6 more)

### Community 78 - "InventoryProductGridComponent"
Cohesion: 0.27
Nodes (6): dialogo(), fila(), P, registrar(), stockEnTabla(), fijarStock()

### Community 79 - "Protocolo de Usabilidad — FrontTRT"
Cohesion: 0.13
Nodes (14): 1. Preparación (checklist facilitador), 2. Perfiles, 3. Las 5 tareas (con éxito observable), 4. Métricas por tarea (llenar por usuario), 5. Cuestionario SUS (aplicar al final, 1-5), 6. Heurísticas a observar (Nielsen, checklist rápido), 7. Plantilla de hallazgo (una por problema), 8. Siguientes pasos tras la sesión (+6 more)

### Community 80 - "sale-detail.mapper.ts"
Cohesion: 0.19
Nodes (9): HTTP_RETRY_CONFIG, RETRYABLE_CODES_STATUSES, ExponentialBackoffStrategy, Injectable, RetryConfig, RETRY_CONFIG, RetryStrategy, canRetryRequest() (+1 more)

### Community 81 - "skeleton.component.ts"
Cohesion: 0.29
Nodes (10): options, assets, browser, index, outputPath, polyfills, scripts, styles (+2 more)

### Community 83 - "SalesHistoryPageComponent"
Cohesion: 0.13
Nodes (3): SalesPaymentMethod, SalesPageComponent, Component

### Community 84 - "Plan de Implementación — Sincronización Frontend con Backend (Develop)"
Cohesion: 0.17
Nodes (11): 2. Estado actual del Frontend vs Backend (GAPS), 3. Índice de Fases, 4. Tabla de archivos por fase (resumen), 5. Consideraciones de Arquitectura (recordatorio), 6. Riesgos y decisiones, 7. Peticiones sugeridas al Backend (NOTIFICAR al dev backend — NO las hace el frontend), Checklist Fase 6, Fase 6 — Feature Clientes (real) (+3 more)

### Community 85 - "api.ts"
Cohesion: 0.29
Nodes (7): ADMIN_OR_MANAGER, ALL_ROLES_MENU, enter(), link(), nav(), ONLY_ADMIN, E2eRole

### Community 86 - "resolveHttpErrorMessage"
Cohesion: 0.11
Nodes (12): stubbed, StubPage, Component, PERSISTENT_STORAGE_PORT, STORAGE_PORT, StoragePort, provideStorage(), InMemoryStorageService (+4 more)

### Community 88 - "Fase 3 — Feature de Notificaciones"
Cohesion: 0.20
Nodes (10): 3.1 Estructura de carpetas, 3.2 Domain, 3.3 Application — Use Cases, 3.4 Application — Facade, 3.5 Infrastructure, 3.6 Presentation, 3.7 Integración con Shell, 3.8 Endpoints del Backend (estimados) (+2 more)

### Community 89 - "🪟 Guía para Windows"
Cohesion: 0.20
Nodes (9): 1. Ejecutar el AppImage, 1. Generar el Ejecutable (`.exe`) desde Linux, 2. Generar desde Windows (Alternativa), 2. Instalador .deb (Opcional), 3. Instalación en Windows, 🐧 Guía para Linux, 🪟 Guía para Windows, Manual de Instalación - FrontTRT (+1 more)

### Community 90 - "Fase 5 — Feature de Inventario por Sucursal"
Cohesion: 0.22
Nodes (9): 5.1 Estructura de carpetas, 5.2 Domain, 5.3 Application — Use Cases, 5.4 Presentation, 5.5 Routing y Navegación, 5.6 Endpoints del Backend (estimados), 5.7 Integración con Productos, Checklist Fase 5 (+1 more)

### Community 91 - "Contexto tesis frontend FrontTRT — documento de trabajo"
Cohesion: 0.22
Nodes (8): 1. Objetivo, 2. Regla principal: usar siempre la skill humanizer, 3. Lo ya hecho: 4.1.6.1 y 4.1.6.2 (textos aprobados por el autor), 4. Lo que falta y cómo seguir, 5. Borrador para revisión: 4.1.6.3 Punto de venta, 6. Borrador para revisión: 4.1.6.4 Inventario por sucursal, 7. Borrador para revisión: 4.1.6.5 Autenticación y control por rol, Contexto tesis frontend FrontTRT — documento de trabajo

### Community 92 - "clients.routes.ts"
Cohesion: 0.29
Nodes (6): dir, [entrada = 'manual.html', nombrePdf = 'Manual-Usuario-TRT.pdf'], numeros, opciones, paginas, salida

### Community 93 - "FrontTRT"
Cohesion: 0.25
Nodes (7): Build, Code scaffolding, Development server, FrontTRT, Further help, Running end-to-end tests, Running unit tests

### Community 94 - "Resumen de cambios en el Backend (Develop)"
Cohesion: 0.29
Nodes (6): 1. Reportes de Ventas (ya mergeado en Develop), 2. Búsqueda de Productos (cambio local no commiteado), 3. Nueva app `inventario` (rama `Inventario_sucursales`, NO mergeada), 4. Nueva app `notifications` (rama `feature-notificaciones`, NO mergeada), Prioridad de implementación en el Frontend, Resumen de cambios en el Backend (Develop)

### Community 95 - "Fase 4 — Feature de Sucursales"
Cohesion: 0.29
Nodes (7): 4.1 Estructura de carpetas, 4.2 Domain, 4.3 Presentation — Página, 4.4 Routing y Navegación, 4.5 Endpoints del Backend (estimados), Checklist Fase 4, Fase 4 — Feature de Sucursales

### Community 96 - "1.2 Apps MODIFICADAS"
Cohesion: 0.29
Nodes (7): 1.1 Apps NUEVAS (ya mergeadas en Develop), 1.2 Apps MODIFICADAS, 1. Resumen de cambios detectados en el Backend, Notifications, Producto (breaking changes), Usuario, Ventas (breaking changes)

### Community 97 - "Fase 1 — Arreglo de Tipos de Reporte"
Cohesion: 0.33
Nodes (6): 1.1 Domain — `report-params.model.ts`, 1.2 Infrastructure — `report-repository.impl.ts`, 1.3 Presentation — `reports.page.ts`, 1.4 Presentation — `reports.page.html`, Checklist Fase 1, Fase 1 — Arreglo de Tipos de Reporte

### Community 98 - "Fase 2 — Incluir `codigoSAT` en DTO de Producto"
Cohesion: 0.33
Nodes (6): 2.1 Verificar DTOs, 2.2 Domain — `product.entity.ts`, 2.3 Infrastructure — `product.mapper.ts`, 2.4 Presentation (si aplica), Checklist Fase 2, Fase 2 — Incluir `codigoSAT` en DTO de Producto

### Community 99 - "Archivos a modificar en cada fase"
Cohesion: 0.33
Nodes (6): Archivos a modificar en cada fase, Fase 1 — Reportes, Fase 2 — Producto DTO, Fase 3 — Notificaciones (todo nuevo), Fase 4 — Sucursales (todo nuevo), Fase 5 — Inventario por Sucursal (todo nuevo)

### Community 100 - "Fase 1 — Perfil de usuario + sucursal en sesión"
Cohesion: 0.33
Nodes (6): 1.1 Domain (feature `auth`), 1.2 Application, 1.3 Infrastructure, 1.4 Presentation, Checklist Fase 1, Fase 1 — Perfil de usuario + sucursal en sesión

### Community 101 - "Fase 3 — Productos: limpieza + filtros nuevos"
Cohesion: 0.33
Nodes (6): 3.1 Domain, 3.2 Application / Infrastructure, 3.3 Búsqueda por código de barras (endpoint dedicado), 3.4 Presentation, Checklist Fase 3, Fase 3 — Productos: limpieza + filtros nuevos

### Community 102 - "Fase 4 — Reescritura de Inventario por Sucursal"
Cohesion: 0.33
Nodes (6): 4.1 Domain, 4.2 Infrastructure, 4.3 Application, 4.4 Presentation, Checklist Fase 4, Fase 4 — Reescritura de Inventario por Sucursal

### Community 103 - "Plan de Implementación — Frontend para Cambios del Backend"
Cohesion: 0.40
Nodes (4): Orden de ejecución recomendado, Plan de Implementación — Frontend para Cambios del Backend, Resumen de Prioridades, Índice de Fases

### Community 104 - "Consideraciones de Arquitectura"
Cohesion: 0.40
Nodes (5): Clean Architecture — Capas por feature, Consideraciones de Arquitectura, Patrones utilizados, Registro de Providers, SOLID

### Community 105 - "Fase 0 — Hotfixes de contrato (desbloqueo inmediato)"
Cohesion: 0.40
Nodes (5): 0.1 Auth — endpoint de refresh, 0.2 Sales — endpoint de detalle, 0.3 Productos — búsqueda, Checklist Fase 0, Fase 0 — Hotfixes de contrato (desbloqueo inmediato)

### Community 106 - "Fase 2 — Re-alineación de Sucursales"
Cohesion: 0.40
Nodes (5): 2.1 Domain, 2.2 Application / Infrastructure, 2.3 Presentation, Checklist Fase 2, Fase 2 — Re-alineación de Sucursales

### Community 107 - "ProductRepositoryImpl"
Cohesion: 0.10
Nodes (23): CreateInventarioRequestDto, InventarioRefDto, MovementResponseDto, RegisterMovementRequestDto, GetInventariosUseCase, Injectable, GetMovementsUseCase, Injectable (+15 more)

### Community 109 - "Fase 5 — Ventas: integración con inventario y precios por sucursal"
Cohesion: 0.50
Nodes (4): 5.1 Application / Infrastructure, 5.2 Presentation, Checklist Fase 5, Fase 5 — Ventas: integración con inventario y precios por sucursal

### Community 110 - "development"
Cohesion: 0.22
Nodes (9): build, builder, configurations, defaultConfiguration, development, buildTarget, extractLicenses, optimization (+1 more)

### Community 111 - "3. Casos por módulo"
Cohesion: 0.13
Nodes (15): 3.10 Usuarios / Admin — `FLU-USR`, 3.11 Gerente — `FLU-GER`, 3.12 Reportes — `FLU-REP`, 3.13 Notificaciones — `FLU-NOT`, 3.14 Permisos — `FLU-PER`, 3.1 Auth — `FLU-AUT`, 3.2 Ventas (POS) — `FLU-VEN`, 3.3 Historial de ventas — `FLU-HIS` (+7 more)

### Community 113 - "ProductGridComponent"
Cohesion: 0.12
Nodes (17): linea(), panel(), pdfATexto(), reporteHoy(), resumen(), A, ANIO, dd() (+9 more)

### Community 114 - "Plan de pruebas E2E de flujos — backend local"
Cohesion: 0.11
Nodes (18): 0.1 Motivo, 0.2 Paso 0 de cada fase: sincronizar con el remoto, 0.3 Coordinación, 0.4 Regla para bugs encontrados, 0. Motivo y forma de trabajo, 1.1 Piezas, 1.2 Datos semilla, 1.3 Reset y ejecución (+10 more)

### Community 117 - "local"
Cohesion: 0.33
Nodes (6): local, buildTarget, extractLicenses, fileReplacements, optimization, sourceMap

### Community 118 - "BranchPricingTableComponent"
Cohesion: 0.40
Nodes (3): ProductGridComponent, Component, ViewChild

### Community 119 - "production"
Cohesion: 0.20
Nodes (10): serve, production, baseHref, budgets, buildTarget, fileReplacements, outputHashing, builder (+2 more)

### Community 121 - "NotificationsBadgeComponent"
Cohesion: 0.22
Nodes (3): NOTIFICATIONS_ROUTES, NotificationsBadgeComponent, Component

### Community 122 - "inventory-repository.ts"
Cohesion: 0.32
Nodes (4): BranchInventoryDto, InventoryItemDto, BranchInventory, InventoryMapper

### Community 124 - "inventory.mapper.ts"
Cohesion: 0.38
Nodes (3): MovementType, MovementListComponent, Component

### Community 125 - "cart-item.component.ts"
Cohesion: 0.36
Nodes (4): CartItemComponent, Component, QuantityControlComponent, Component

### Community 126 - "inventario.real.spec.ts"
Cohesion: 0.13
Nodes (12): A, altaComoGerente(), idEnBd(), perfilEnBd(), UsuarioApi, buscar(), busqueda(), crearProductoApi() (+4 more)

### Community 128 - "plan-pruebas-admin-auth-ventas.md"
Cohesion: 0.25
Nodes (8): SIS-010 Flujo feliz de venta en mostrador, SIS-011 Carrito bloquea venta vacía, SIS-012 Venta exige método de pago, SIS-013 Venta exige inventario asignado, SIS-014 Límite de stock en carrito, SIS-015 Cálculo subtotal/IVA/total, SIS-016 Búsqueda y agregado rápido, VENTAS / POS (P0)

### Community 129 - "ContextualLogger"
Cohesion: 0.29
Nodes (7): AUTH (P0), SIS-001 Login válido redirige a ventas, SIS-002 Login inválido muestra error y no navega, SIS-003 Validación de campos vacíos, SIS-004 Guard bloquea rutas privadas sin sesión, SIS-005 Sesión persistente y refresh token, SIS-006 Logout limpia sesión

### Community 130 - "UpdateSupplierUseCase"
Cohesion: 0.40
Nodes (5): INVENTARIO (P1), SIS-020 Alta de producto, SIS-021 Edición y validación de precio/stock, SIS-022 Inventario por sucursal, SIS-023 Precio diferenciado por sucursal

### Community 131 - "ContextualLogger"
Cohesion: 0.36
Nodes (4): HostBinding, DropdownTriggerDirective, Directive, HostListener

### Community 132 - "sales.pos.spec.ts"
Cohesion: 0.07
Nodes (35): P0_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES, setup(), row(), setPriceBtn(), setup(), setup() (+27 more)

### Community 135 - "plan-pruebas.md"
Cohesion: 0.21
Nodes (9): ConsoleLoggerAdapter, Injectable, LogLevel, LogEntry, LoggerAdapter, LOGGER_ADAPTERS, LoggerService, Injectable (+1 more)

### Community 137 - "back-e2e.sh"
Cohesion: 0.40
Nodes (4): DATABASE_URL, DEBUG, SECRET_KEY, back-e2e.sh script

### Community 139 - "NotificationsPageComponent"
Cohesion: 0.23
Nodes (7): ProductCreateRequestDto, PaginatedProductResponseDto, ProductResponseDto, ProductStockResponseDto, ProductUpdateRequestDto, CreateProductPayload, UpdateProductPayload

### Community 141 - "plan-pruebas.md"
Cohesion: 0.18
Nodes (10): testBed, configureTestingModule(), setup(), facadeLoading(), render(), startAndFlushInitial(), flushError(), flush() (+2 more)

### Community 143 - "ADMIN / NOTIFICACIONES / SHELL (P3)"
Cohesion: 0.24
Nodes (3): NoopStorage, sanitizeUrlParams(), SENSITIVE_QUERY_PARAMS

### Community 144 - "delete-sale.usecase.ts"
Cohesion: 0.09
Nodes (27): CompleteSaleResult, CreateCompleteSaleUseCase, Injectable, CreateSaleUseCase, Injectable, DeleteSaleUseCase, Injectable, GetSaleDetailUseCase (+19 more)

## Knowledge Gaps
- **436 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `schematics` (+431 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthFacade` connect `InventoryFacade` to `Community 3`, `Community 5`, `Community 7`, `admin.real.spec.ts`, `ProductRepositoryImpl`, `Community 12`, `login.page.ts`, `MovementListComponent`, `delete-sale.usecase.ts`, `client.entity.ts`, `branch-form-dialog.component.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `LoggerService` connect `plan-pruebas.md` to `Community 33`, `Community 1`, `Community 5`, `Community 6`, `Community 7`, `Community 39`, `branch-repository.impl.ts`, `ProductRepositoryImpl`, `Community 12`, `client.entity.ts`, `delete-sale.usecase.ts`, `plan-pruebas.md`, `ContextualLogger`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ToastService` connect `Community 12` to `InventoryFacade`, `Community 33`, `Community 1`, `Community 5`, `plan-pruebas.md`, `Community 7`, `ProductRepositoryImpl`, `login.page.ts`, `MovementListComponent`, `delete-sale.usecase.ts`, `client.entity.ts`, `branch-form-dialog.component.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LoggerService` (e.g. with `configure()` and `setup()`) actually correct?**
  _`LoggerService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `SessionStateService` (e.g. with `configureTestingModule()` and `setup()`) actually correct?**
  _`SessionStateService` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.055717336439526303 - nodes in this community are weakly interconnected._