# Graph Report - FrontTRT  (2026-11-13)

## Corpus Check
- 565 files · ~185,979 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2266 nodes · 6297 edges · 106 communities (89 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a275ef1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
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
- Branch
- Community 15
- InMemoryStorageService
- app.config.ts
- Branch
- Community 19
- Community 20
- user-repository.impl.ts
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- logger.service.ts
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- payment-method.mapper.ts
- Community 35
- product-repository.impl.ts
- PaginatedResponse
- Community 38
- Community 39
- inventory-by-branch.facade.ts
- Community 41
- InventoryFacade
- notifications.facade.ts
- Community 44
- Community 45
- InventoryFacade
- MovementListComponent
- Community 48
- Community 49
- Community 50
- Community 51
- BranchPricingTableComponent
- Community 53
- Community 54
- Community 55
- inventory-repository.ts
- Community 57
- CreateSupplierUseCase
- InventoryRepositoryImpl
- NotificationsPageComponent
- Community 61
- Community 62
- inventory-product-grid.component.spec.ts
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- ProductGridComponent
- clients.facade.ts
- admin.users.spec.ts
- Protocolo de Usabilidad — FrontTRT
- BranchesFacade
- Plan de Implementación — Sincronización Frontend con Backend (Develop)
- cart-item.component.ts
- GetBranchByIdUseCase
- Fase 3 — Feature de Notificaciones
- 🪟 Guía para Windows
- Fase 5 — Feature de Inventario por Sucursal
- Contexto tesis frontend FrontTRT — documento de trabajo
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
- Fase 5 — Ventas: integración con inventario y precios por sucursal
- CLAUDE.md
- cart-item.component.spec.ts
- app.routes.integration.spec.ts

## God Nodes (most connected - your core abstractions)
1. `LOGGER_PORT` - 56 edges
2. `APP_ENV` - 52 edges
3. `Product` - 46 edges
4. `Client` - 42 edges
5. `LoggerService` - 41 edges
6. `SessionStateService` - 40 edges
7. `LoggerPort` - 39 edges
8. `ToastService` - 38 edges
9. `Branch` - 36 edges
10. `LogLevel` - 32 edges

## Surprising Connections (you probably didn't know these)
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/auth/application/services/session-state.service.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branch-pricing/infrastructure/repositories/branch-price-repository.impl.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branch-pricing/presentation/components/branch-pricing-table/branch-pricing-table.component.spec.ts → setup-jest.ts
- `configure()` --references--> `testBed`  [EXTRACTED]
  src/app/features/branches/presentation/pages/branches-page/branches.page.integration.spec.ts → setup-jest.ts
- `setup()` --references--> `testBed`  [EXTRACTED]
  src/app/features/clients/presentation/components/client-form-dialog/client-form-dialog.component.spec.ts → setup-jest.ts

## Import Cycles
- 1-file cycle: `src/app/app.routes.ts -> src/app/app.routes.ts`

## Communities (106 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (10): toTicketPrintPayload(), DetailedSale, SaleTicket, SaleTicketProductProps, SaleTicketProps, SaleFetchError, DetailedSaleDTO, SaleTicketDto (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (6): AppRoutes, routes, SessionStateService, Injectable, authGuard(), roleGuard()

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (5): LoggerPort, provideStorage(), LocalStorageService, Injectable, LOCAL_STORAGE

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (34): GetReportUseCase, Injectable, ReportParams, ReportType, ReportRepository, ReportRepositoryImpl, Injectable, ReportsPageComponent (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (11): Injectable, UpdateSaleUseCase, DetailedSaleItem, DetailedSaleProps, Order, OrderItem, OrderItemProps, SaleProps (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): NotificationsFacade, Injectable, REPORTS_ROUTES, SupplierCreateRequestDto, SupplierResponseDto, SupplierUpdateRequestDto, SuppliersFacade, Injectable (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (10): SaleDetail, SaleDetailFactory, UpdateSaleDetailPayload, SaleDetailCreateRequestDto, SaleDetailResponseDto, SaleDetailUpdateRequestDto, SaleDetailMapper, SaleDetailRepositoryImpl (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (22): CompleteSaleResult, CreateCompleteSaleUseCase, Injectable, CreateSaleUseCase, Injectable, DeleteSaleUseCase, Injectable, GetSaleDetailUseCase (+14 more)

### Community 8 - "inventory-by-branch.facade.ts"
Cohesion: 0.06
Nodes (36): BranchCreateRequestDto, BranchResponseDto, BranchUpdateRequestDto, BranchesFacade, Injectable, CreateBranchUseCase, Injectable, DeleteBranchUseCase (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (28): AppSettingsService, Injectable, SKIP_TRAILING_SLASH, trailingSlashInterceptor(), ConsoleLoggerAdapter, Injectable, ContextualLogger, LogLevel (+20 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (44): build, extract-i18n, serve, test, builder, configurations, defaultConfiguration, options (+36 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (32): BranchPriceCreateRequestDto, BranchPriceResponseDto, PriceHistoryResponseDto, BranchPricingFacade, Injectable, DeactivatePriceUseCase, Injectable, GetActivePriceUseCase (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (23): AdminManagementPageComponent, Component, UserCreateRequestDto, UserResponseDto, UserUpdateRequestDto, Injectable, UsersFacade, CreateUserUseCase (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (3): NoopStorage, sanitizeUrlParams(), SENSITIVE_QUERY_PARAMS

### Community 14 - "Branch"
Cohesion: 0.16
Nodes (13): GetPaymentMethodsUseCase, Injectable, PaymentMethod, CreatePaymentMethodPayload, PaymentMethodRepository, UpdatePaymentMethodPayload, PaymentMethodCreateRequestDto, PaymentMethodResponseDto (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (31): {
    generateTicket,
    generatePreview,
}, { ipcMain }, registerPrinterIpc(), { app, BrowserWindow, ipcMain }, getSenderWindow(), registerWindowIpc(), { app, BrowserWindow }, createMainWindow() (+23 more)

### Community 16 - "InMemoryStorageService"
Cohesion: 0.11
Nodes (12): AppComponent, Component, appConfig, configure(), setup(), TicketModalComponent, Component, ToastContainerComponent (+4 more)

### Community 17 - "app.config.ts"
Cohesion: 0.11
Nodes (11): JwtUtils, buildSession(), now(), AUTH_ROUTES, LegacySessionPrimitives, Session, SessionPrimitives, UserRole (+3 more)

### Community 18 - "Branch"
Cohesion: 0.14
Nodes (4): ProductFormDialogComponent, Component, InventoryPageComponent, Component

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (26): scripts, a11y, build, build:installer, build:installer:win, build:prod, build:win, e2e (+18 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (4): LoginPageComponent, fillAndSubmit(), submitButton(), Component

### Community 21 - "user-repository.impl.ts"
Cohesion: 0.23
Nodes (9): HttpErrorHandlerService, Injectable, buildHttpErrorLog(), normalizePayload(), RetryStrategyService, Injectable, httpErrorInterceptor(), Injectable (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (11): GetMyProfileUseCase, Injectable, Injectable, UpdateMySucursalUseCase, UserProfile, ProfileRepository, ProfileResponseDto, UpdateSucursalRequestDto (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (48): PaginatedResponse, PaginationParams, BranchPricingTableComponent, setup(), Component, ProductCreateRequestDto, PaginatedProductResponseDto, ProductResponseDto (+40 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (13): Casos de Prueba del Sistema — FrontTRT (E2E), HISTORIAL / REPORTES (P2), Matriz de automatización sugerida, SIS-030 CRUD sucursales, SIS-031 Alta de cliente con validación, SIS-032 CRUD proveedores, SIS-040 Historial filtra por fecha/sucursal, SIS-041 Reportes muestran totales coherentes (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (22): devDependencies, allure-playwright, @angular-builders/jest, @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular, @axe-core/playwright, concurrently (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (11): HTTP_RETRY_CONFIG, RETRYABLE_CODES_STATUSES, ExponentialBackoffStrategy, Injectable, RetryConfig, RETRY_CONFIG, RETRY_COUNT, RetryStrategy (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (16): withoutTrailingSlash(), LoginCommand, LoginUseCase, Injectable, AuthError, InvalidCredentialsError, NetworkAuthError, UnknownAuthError (+8 more)

### Community 28 - "logger.service.ts"
Cohesion: 0.23
Nodes (6): DefaultSearchStrategy, Injectable, GlobalSearchService, Injectable, SEARCH_STRATEGY, SearchStrategy

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (10): DropdownHostComponent, Component, DropdownItemComponent, Component, DropdownMenuComponent, Component, IconButtonComponent, Component (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (23): CategorySliderComponent, Component, setup(), CreateProductTypeUseCase, Injectable, DeleteProductTypeUseCase, Injectable, GetProductTypesUseCase (+15 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (8): CreateSaleDetailUseCase, Injectable, DeleteSaleDetailUseCase, Injectable, CreateSaleDetailPayload, SaleDetailRepository, changeClientButton(), openClientSelector()

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (8): provideControlValueAccessor(), BaseFormField, Directive, InputComponent, Component, SearchInputComponent, Component, resolveAriaLabel()

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (5): NotificationResponseDto, Notification, NotificationMapper, NotificationRepositoryImpl, Injectable

### Community 34 - "payment-method.mapper.ts"
Cohesion: 0.11
Nodes (13): GetSalesHistoryUseCase, Injectable, SaleHistory, SaleDetailModalComponent, Component, SalesHistoryTableComponent, Component, SalesHistoryPageComponent (+5 more)

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
Cohesion: 0.18
Nodes (7): UpdateSalePayload, SaleCreateRequestDto, SaleResponseDto, SaleUpdateRequestDto, SaleMapper, SaleRepositoryImpl, Injectable

### Community 40 - "inventory-by-branch.facade.ts"
Cohesion: 0.10
Nodes (17): testBed, AuthFacade, Injectable, configureTestingModule(), flushError(), InventoryItem, InventoryTableComponent, setup() (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (3): NOTIFICATIONS_ROUTES, NotificationsBadgeComponent, Component

### Community 42 - "InventoryFacade"
Cohesion: 0.25
Nodes (8): SIS-010 Flujo feliz de venta en mostrador, SIS-011 Carrito bloquea venta vacía, SIS-012 Venta exige método de pago, SIS-013 Venta exige inventario asignado, SIS-014 Límite de stock en carrito, SIS-015 Cálculo subtotal/IVA/total, SIS-016 Búsqueda y agregado rápido, VENTAS / POS (P0)

### Community 43 - "notifications.facade.ts"
Cohesion: 0.21
Nodes (7): DeleteNotificationUseCase, Injectable, MarkAllNotificationsReadUseCase, Injectable, MarkNotificationReadUseCase, Injectable, NotificationRepository

### Community 44 - "Community 44"
Cohesion: 0.13
Nodes (15): build, appId, copyright, directories, files, linux, mac, productName (+7 more)

### Community 46 - "InventoryFacade"
Cohesion: 0.36
Nodes (3): ButtonComponent, Component, ConfirmDialogData

### Community 47 - "MovementListComponent"
Cohesion: 0.29
Nodes (7): AUTH (P0), SIS-001 Login válido redirige a ventas, SIS-002 Login inválido muestra error y no navega, SIS-003 Validación de campos vacíos, SIS-004 Guard bloquea rutas privadas sin sesión, SIS-005 Sesión persistente y refresh token, SIS-006 Logout limpia sesión

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (3): DropdownComponent, Component, HostListener

### Community 49 - "Community 49"
Cohesion: 0.06
Nodes (42): P0_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES, ADMIN_OR_MANAGER, ALL_ROLES_MENU, enter(), link(), nav() (+34 more)

### Community 50 - "Community 50"
Cohesion: 0.21
Nodes (9): AuthTokenRefreshOrchestrator, Injectable, RefreshTokenUseCase, Injectable, AUTH_ENDPOINTS, isRefreshRequest(), isUnauthorizedError(), withBearerToken() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (4): HostBinding, DropdownTriggerDirective, Directive, HostListener

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (7): author, description, homepage, main, name, private, version

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (4): MovementFormDialogComponent, MovementFormDialogData, setup(), Component

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (5): SalesCartItem, SalesPageComponent, Component, SalesCartService, Injectable

### Community 58 - "CreateSupplierUseCase"
Cohesion: 0.07
Nodes (30): CreateInventarioRequestDto, InventarioRefDto, BranchInventoryDto, InventoryItemDto, MovementResponseDto, RegisterMovementRequestDto, GetInventariosUseCase, Injectable (+22 more)

### Community 59 - "InventoryRepositoryImpl"
Cohesion: 0.18
Nodes (7): DESKTOP_PORT, DesktopPort, DesktopPrintResult, ProductGridComponent, Component, ViewChild, TODO: si se requiere filtro por tipo, InventoryItem debería incluir id_tipo/nomb

### Community 60 - "NotificationsPageComponent"
Cohesion: 0.40
Nodes (5): ADMIN / NOTIFICACIONES / SHELL (P3), SIS-050 Gestión de usuarios y roles, SIS-051 Notificaciones visibles, SIS-052 Layout y navegación base, SIS-053 Acceso por rol

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (18): 10. Riesgos principales, 11. Estado real de la suite (2026-09-14, baseline), 1. Objetivos, 2.1 Dentro del alcance, 2.2 Fuera del alcance (esta fase), 2. Alcance, 3. Estrategia por niveles (pirámide), 4. Matriz de priorización (riesgo × uso) (+10 more)

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): CashierPreview, CashiersManagementPageComponent, Component

### Community 63 - "inventory-product-grid.component.spec.ts"
Cohesion: 0.40
Nodes (5): INVENTARIO (P1), SIS-020 Alta de producto, SIS-021 Edición y validación de precio/stock, SIS-022 Inventario por sucursal, SIS-023 Precio diferenciado por sucursal

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (5): 2.1 Reglas de ahorro, 2.2 Prompt para abrir cada sesión, 2.3 Prompt para un subagente (lotes de Fases 3 y 4), 2.4 Estimado, 2. Cómo ejecutar este plan (costo con plan Pro de $20)

### Community 77 - "clients.facade.ts"
Cohesion: 0.17
Nodes (9): 1. Alcance, 3.1 Archivos y comandos, 3.2 Specs de referencia (copiar estilo, no reinventar), 3.3 Reglas de los tests, 3. Convenciones, 4. Hallazgos: severidad y qué se arregla, 5. Registro de hallazgos, 7. Trazabilidad casos de sistema ↔ pruebas (+1 more)

### Community 78 - "admin.users.spec.ts"
Cohesion: 0.15
Nodes (12): stubbed, StubPage, Component, LOGGER_PORT, PERSISTENT_STORAGE_PORT, STORAGE_PORT, StoragePort, InMemoryStorageService (+4 more)

### Community 79 - "Protocolo de Usabilidad — FrontTRT"
Cohesion: 0.13
Nodes (14): 1. Preparación (checklist facilitador), 2. Perfiles, 3. Las 5 tareas (con éxito observable), 4. Métricas por tarea (llenar por usuario), 5. Cuestionario SUS (aplicar al final, 1-5), 6. Heurísticas a observar (Nielsen, checklist rápido), 7. Plantilla de hallazgo (una por problema), 8. Siguientes pasos tras la sesión (+6 more)

### Community 84 - "Plan de Implementación — Sincronización Frontend con Backend (Develop)"
Cohesion: 0.17
Nodes (11): 2. Estado actual del Frontend vs Backend (GAPS), 3. Índice de Fases, 4. Tabla de archivos por fase (resumen), 5. Consideraciones de Arquitectura (recordatorio), 6. Riesgos y decisiones, 7. Peticiones sugeridas al Backend (NOTIFICAR al dev backend — NO las hace el frontend), Checklist Fase 6, Fase 6 — Feature Clientes (real) (+3 more)

### Community 86 - "cart-item.component.ts"
Cohesion: 0.12
Nodes (11): CartItemComponent, Component, CartPanelComponent, Component, PaymentMethodSelectorComponent, Component, setup(), QuantityControlComponent (+3 more)

### Community 87 - "GetBranchByIdUseCase"
Cohesion: 0.16
Nodes (9): SalesSearchStrategy, Injectable, ProductCardComponent, Component, setup(), IoCallback, SalesPaymentMethod, SalesProduct (+1 more)

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

### Community 109 - "Fase 5 — Ventas: integración con inventario y precios por sucursal"
Cohesion: 0.50
Nodes (4): 5.1 Application / Infrastructure, 5.2 Presentation, Checklist Fase 5, Fase 5 — Ventas: integración con inventario y precios por sucursal

### Community 118 - "cart-item.component.spec.ts"
Cohesion: 0.06
Nodes (37): ClientCreateRequestDto, ClientResponseDto, ClientUpdateRequestDto, ClientsFacade, Injectable, CreateClientUseCase, Injectable, DeleteClientUseCase (+29 more)

## Knowledge Gaps
- **354 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `schematics` (+349 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LoggerService` connect `Community 9` to `Community 2`, `Community 5`, `Community 7`, `inventory-by-branch.facade.ts`, `Community 11`, `Community 12`, `notifications.facade.ts`, `admin.users.spec.ts`, `InMemoryStorageService`, `user-repository.impl.ts`, `cart-item.component.spec.ts`, `Community 23`, `CreateSupplierUseCase`, `Community 31`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `AuthFacade` connect `inventory-by-branch.facade.ts` to `Community 3`, `Community 7`, `InventoryRepositoryImpl`, `admin.users.spec.ts`, `app.config.ts`, `Community 20`, `cart-item.component.spec.ts`, `Community 27`, `Community 31`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `APP_ENV` connect `Community 9` to `Community 0`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `inventory-by-branch.facade.ts`, `Community 11`, `Community 12`, `Branch`, `user-repository.impl.ts`, `Community 23`, `Community 27`, `Community 30`, `Community 31`, `Community 33`, `Community 50`, `CreateSupplierUseCase`, `admin.users.spec.ts`, `cart-item.component.spec.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _355 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06416275430359937 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09513742071881606 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.05612694681163679 - nodes in this community are weakly interconnected._