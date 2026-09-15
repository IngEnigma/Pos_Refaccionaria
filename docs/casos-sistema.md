# Casos de Prueba del Sistema — FrontTRT (E2E)

> Formato: Gherkin (Given/When/Then). Automatizables con Playwright en `e2e/`.
> Trazabilidad: `SIS-XXX` → `e2e/*.spec.ts` → módulo.
> Datos base: usuarios seed en `e2e/fixtures/test-users.ts` (ana.centro y carlos.centro en
> Suc. 1 Centro, maria/jorge.norte en Suc. 2 Norte, luis/sofia.sur en Suc. 3 Sur,
> admin_neon/vendedor1 sin perfil), ≥10 productos, 2 métodos de pago, inventario asignado.
> Los specs con mocks no necesitan el seed; `e2e/auth.real.spec.ts` usa `ana.centro`
> (con sucursal) y `admin_neon` (empty-state sin sucursal). Se corre con
> `npm run e2e:real` (sirve en puerto 5173 por el CORS del backend, ver plan §6).
> Convención: `P0` debe estar 100% verde para liberar.

---

## AUTH (P0)

### SIS-001 Login válido redirige a ventas
**Prioridad:** P0 — **Auto:** `e2e/auth.login.spec.ts`
```gherkin
Given el usuario está en "/login" sin sesión
When ingresa credenciales válidas y pulsa "Iniciar sesión"
Then es redirigido a "/sales"
And ve el layout principal (navbar + sidebar)
And el token se persiste según "recordarme"
```

### SIS-002 Login inválido muestra error y no navega
**Prioridad:** P0 — **Auto:** `e2e/auth.login.spec.ts`
```gherkin
Given el usuario está en "/login"
When ingresa usuario/contraseña incorrectos y envía
Then permanece en "/login"
And ve toast/mensaje "credenciales inválidas" (o texto equivalente)
And no se guarda token en storage
```

### SIS-003 Validación de campos vacíos
**Prioridad:** P0
```gherkin
Given el usuario está en "/login"
When pulsa "Iniciar sesión" con campos vacíos
Then los campos se marcan como touched con error "requerido"
And no se llama al backend (0 requests a /login)
```

### SIS-004 Guard bloquea rutas privadas sin sesión
**Prioridad:** P0 — **Auto:** `e2e/auth.login.spec.ts`
```gherkin
Given el usuario no tiene sesión
When navega directo a "/sales", "/inventory", "/reports"
Then es redirigido a "/login?redirectTo=..."
```

### SIS-005 Sesión persistente y refresh token
**Prioridad:** P0
```gherkin
Given el usuario inició sesión con "recordarme"
When recarga la app con accessToken expirado pero refresh válido
Then la sesión se restaura sin pedir login (refresh silencioso)
When el refresh también expiró
Then es llevado a "/login"
```

### SIS-006 Logout limpia sesión
**Prioridad:** P1
```gherkin
Given el usuario autenticado en "/sales"
When pulsa "Cerrar sesión"
Then vuelve a "/login"
And el storage queda sin tokens
And intentar volver a "/sales" lo devuelve a "/login"
```

## VENTAS / POS (P0)

### SIS-010 Flujo feliz de venta en mostrador
**Prioridad:** P0
```gherkin
Given vendedor autenticado en "/sales" con inventario asignado y stock > 0
When busca "filtro", agrega 2 unidades al carrito y elige pago "Efectivo"
And pulsa "Confirmar venta"
Then ve confirmación de venta
And el carrito queda vacío
And la venta aparece en "/history"
And el stock del producto disminuye
```

### SIS-011 Carrito bloquea venta vacía
**Prioridad:** P0
```gherkin
Given vendedor en "/sales" con carrito vacío
When pulsa "Confirmar venta"
Then ve error "El carrito está vacío."
And no se llama al backend
```

### SIS-012 Venta exige método de pago
**Prioridad:** P0
```gherkin
Given carrito con 1 producto y sin método de pago
When intenta confirmar
Then ve error "Selecciona un método de pago."
```

### SIS-013 Venta exige inventario asignado
**Prioridad:** P0
```gherkin
Given carrito con producto + pago pero sin inventario de sucursal
When intenta confirmar
Then ve error "No hay inventario asignado para esta sucursal."
```

### SIS-014 Límite de stock en carrito
**Prioridad:** P1
```gherkin
Given producto con stock=3
When intenta agregar 4 unidades (o incrementar más allá de 3)
Then la cantidad se topa en 3
And ve aviso de stock máximo (si aplica)
```

### SIS-015 Cálculo subtotal/IVA/total
**Prioridad:** P0
```gherkin
Given carrito con 1 × $100 y 2 × $50 (subtotal $200)
When revisa el resumen
Then subtotal=$200, IVA=$32 (16%), total=$232 (o regla vigente)
```

### SIS-016 Búsqueda y agregado rápido
**Prioridad:** P1
```gherkin
Given catálogo con "Bujía NGK" y "Filtro aceite"
When escribe "buj" en el buscador
Then solo aparece "Bujía NGK" (fuse.js)
When la agrega
Then aparece en el carrito con qty=1
```

## INVENTARIO (P1)

### SIS-020 Alta de producto
**Prioridad:** P1
```gherkin
Given admin en "/inventory"
When crea producto "Balata delantera" precio 450 stock 20
Then aparece en el listado
And es encontrable por búsqueda
```

### SIS-021 Edición y validación de precio/stock
**Prioridad:** P1
```gherkin
Given producto existente
When edita precio a -10 o texto
Then el form bloquea guardado con error
When pone precio 500 y guarda
Then el listado refleja el nuevo precio
```

### SIS-022 Inventario por sucursal
**Prioridad:** P1
```gherkin
Given admin en "/inventory-by-branch"
When asigna 15 unidades del producto X a sucursal "Centro"
Then la sucursal muestra stock 15
And ventas de esa sucursal descuentan de ahí
```

### SIS-023 Precio diferenciado por sucursal
**Prioridad:** P1
```gherkin
Given producto con precio base $100
When en "/branch-pricing" define $110 para sucursal "Norte"
Then ventas en "Norte" usan $110 y en "Centro" $100
```

## SUCURSALES / CLIENTES / PROVEEDORES (P1-P2)

### SIS-030 CRUD sucursales
**Prioridad:** P1
```gherkin
Given admin en "/branches"
When crea sucursal "Sur", la edita y luego la desactiva/elimina
Then el listado refleja cada cambio y valida nombre duplicado
```

### SIS-031 Alta de cliente con validación
**Prioridad:** P2
```gherkin
Given vendedor en "/clients"
When crea cliente sin nombre o con teléfono inválido
Then ve errores y no guarda
When completa datos válidos
Then el cliente queda disponible para asignar a venta (si aplica)
```

### SIS-032 CRUD proveedores
**Prioridad:** P2
```gherkin
Given admin en "/suppliers"
When crea/edita/elimina proveedor
Then el listado se actualiza y la búsqueda lo encuentra
```

## HISTORIAL / REPORTES (P2)

### SIS-040 Historial filtra por fecha/sucursal
**Prioridad:** P2
```gherkin
Given ventas de hoy y de ayer en 2 sucursales
When en "/history" filtra por hoy + sucursal "Centro"
Then solo lista esas ventas con totales correctos
```

### SIS-041 Reportes muestran totales coherentes
**Prioridad:** P2
```gherkin
Given ventas por $1000 hoy
When abre "/reports" del día
Then el total cuadra con "/history" (misma fuente)
```

## ADMIN / NOTIFICACIONES / SHELL (P3)

### SIS-050 Gestión de usuarios y roles
**Prioridad:** P3
```gherkin
Given admin en "/admin" o "/manager"
When crea usuario vendedor y le quita permiso de reportes
Then ese usuario no ve "/reports" (guard/oculto)
```

### SIS-051 Notificaciones visibles
**Prioridad:** P3
```gherkin
Given evento que genera notificación (stock bajo, venta)
When abre "/notifications"
Then ve la notificación y puede marcarla leída
```

### SIS-052 Layout y navegación base
**Prioridad:** P3 — **Auto parcial:** `e2e/a11y.smoke.spec.ts`
```gherkin
Given usuario autenticado
When navega por sidebar a cada módulo permitido
Then cada ruta carga sin error de consola crítico
And navbar/sidebar responden en desktop y móvil (360px)
```

## TRANSVERSALES

### SIS-060 Manejo de error de red con retry
**Prioridad:** P1
```gherkin
Given backend caído (500/timeout) al cargar ventas
When la app reintenta con backoff
Then muestra toast "error de conexión" y no se congela
When el backend vuelve
Then reintenta y carga al refrescar
```

### SIS-061 Accesibilidad crítica sin violaciones serias
**Prioridad:** P1 — **Auto:** `e2e/a11y.smoke.spec.ts` (axe)
```gherkin
Given cualquier página P0 (login, sales)
When se ejecuta axe-core
Then 0 violaciones "critical" o "serious"
And el login es operable solo con teclado (tab + enter)
```

### SIS-062 Responsive POS
**Prioridad:** P2
```gherkin
Given vendedor en tablet/móvil 360px
When abre "/sales"
Then el carrito y el catálogo siguen usables sin scroll horizontal roto
```

---

## Matriz de automatización sugerida

| Fase | Automatizar primero | Comando |
|---|---|---|
| Fase 2 (P0) | SIS-001,002,004,010,011,012,013,015,061 | `npm run e2e -- auth.login,a11y` |
| Fase 3 (P1-P2) | resto | `npm run e2e` completo en CI |

> Cada caso automatizado debe dejar `trace + video` en fallo (ya configurado) y usar `data-testid` en botones críticos (agregar en forms de login/ventas para selectores estables).
