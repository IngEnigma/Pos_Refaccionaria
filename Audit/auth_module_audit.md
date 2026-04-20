# 🔍 Auditoría Profunda — Módulo `/features/auth`

> **Analizado:** 40 archivos (source + tests) · 4 capas · 5 skills de referencia
> **Fecha:** 2026-03-23

---

## 🔴 Problemas Críticos

### 1. `SessionStateService` importa directamente de `infrastructure`

- **Archivo:** [session-state.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/services/session-state.service.ts#L3)
- **Problema:** `application` importa `SessionMapper` de `@features/auth/infrastructure/mappers/auth-session.mapper`
- **Por qué es crítico:** Rompe la **Dependency Rule** de Clean Architecture. La capa `application` **nunca** debe depender de `infrastructure`. El flujo válido es: `presentation → application → domain ← infrastructure`.
- **Principio violado:** **Dependency Inversion (SOLID-D)**, Clean Architecture Dependency Rule
- **Cómo solucionarlo:**
  1. Mover `SessionMapper.toJSON()` / `fromJSON()` a `domain` como métodos estáticos de una clase `SessionSerializer` o como métodos de la propia entidad `Session` (e.g., `Session.fromPrimitives()`, `session.toPrimitives()`).
  2. Definir la interface `SessionPrimitives` en `domain`.
  3. `SessionStateService` solo usa tipos de domain — sin importar nada de infrastructure.

```typescript
// domain/entities/auth-session.entity.ts
export interface SessionPrimitives {
  accessToken: string;
  refreshToken: string | null;
  accessExp: number;
  refreshExp: number;
  userId: string;
  role: UserRole;
  username: string;
}

export class Session {
  // ... existing constructor and methods ...

  static fromPrimitives(p: SessionPrimitives): Session {
    return new Session(p.accessToken, p.refreshToken, p.accessExp, p.refreshExp, p.userId, p.role, p.username);
  }

  toPrimitives(): SessionPrimitives {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken, accessExp: this.accessExp, refreshExp: this.refreshExp, userId: this.userId, role: this.role, username: this.username };
  }
}
```

---

### 2. `RefreshTokenUseCase` usa `LoggerService` concreto en lugar de `LOGGER_PORT`

- **Archivo:** [refresh.usecase.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/usecase/refresh.usecase.ts#L4)
- **Problema:** `import { LoggerService } from '@core/logging/logger.service'` — inyecta la implementación concreta. `LoginUseCase` usa correctamente `LOGGER_PORT`.
- **Por qué es crítico:** Acopla un use case a una implementación concreta, imposibilitando sustituir el logger (ej: testing, producción con reporte a servicio externo). Además, introduce **inconsistencia** entre use cases del mismo feature.
- **Principio violado:** **Dependency Inversion (SOLID-D)**
- **Cómo solucionarlo:**
```diff
-import { LoggerService } from '@core/logging/logger.service';
+import { LOGGER_PORT } from '@core/logging/logger.port';
 ...
-  private readonly logger = inject(LoggerService).withContext('RefreshTokenUseCase');
+  private readonly logger = inject(LOGGER_PORT).withContext('RefreshTokenUseCase');
```

---

### 3. DTOs duplicados entre `application/dtos` e `infrastructure/dtos`

- **Archivos:**
  - [application/dtos/auth-login-request.dto.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/dtos/auth-login-request.dto.ts) ↔ [infrastructure/dtos/auth-login-request.dto.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/dtos/auth-login-request.dto.ts)
  - [application/dtos/auth-login-response.dto.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/dtos/auth-login-response.dto.ts) ↔ [infrastructure/dtos/auth-login-response.dto.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/dtos/auth-login-response.dto.ts)
  - Lo mismo con `auth-refresh-token-request.dto.ts` y `auth-refresh-token-response.dto.ts`
- **Problema:** Son interfaces **idénticas byte a byte**. Los DTOs de application no son usados por nadie — solo se usan los de infrastructure.
- **Por qué es crítico:**
  - Confunde a los desarrolladores sobre cuál DTO usar.
  - Cambios en uno no se reflejan en el otro, creando divergencia silenciosa.
  - Los DTOs de request/response HTTP **pertenecen a infrastructure**, no a application.
- **Principio violado:** **DRY**, **Single Responsibility (SOLID-S)**
- **Cómo solucionarlo:** Eliminar `application/dtos/` completamente. Los DTOs HTTP son contratos de infraestructura. Si application necesita un DTO propio (ej: `LoginCommand`), debe ser semánticamente diferente al de HTTP.

---

### 4. `LoginUseCase` recibe `LoginCredentials` definido en el contrato de Repository

- **Archivo:** [login.usecase.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/usecase/login.usecase.ts#L17)
- **Problema:** `LoginCredentials` está definido en `domain/repository/auth-repository.ts` junto al `AuthRepository`. Un use case no debería recibir como input un tipo definido en un contrato de repository — debería tener su propio command/input DTO.
- **Por qué es un problema:** Acopla la firma del use case a la definición del repository. Si mañana el repository necesita datos adicionales (ej: `deviceId`), fuerza un cambio en el use case sin que sea su responsabilidad.
- **Principio violado:** **Interface Segregation (SOLID-I)**
- **Cómo solucionarlo:** Mover `LoginCredentials` a un archivo propio en domain (ej: `domain/value-objects/login-credentials.ts`) o crear un `LoginCommand` en application que el use case reciba, y mapear al tipo de repository internamente.

---

### 5. `AuthRepository` provider scope: `providedIn: 'root'` en `AuthRepositoryImpl` colisiona con route-level DI

- **Archivo:** [auth-repository.impl.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/repositories/auth-repository.impl.ts#L25)
- **Problema:** `AuthRepositoryImpl` tiene `@Injectable({ providedIn: 'root' })`, pero `auth.routes.ts` también registra `{ provide: AuthRepository, useClass: AuthRepositoryImpl }` a nivel de ruta.
- **Por qué es crítico:** Al tener `providedIn: 'root'`, Angular ya crea una instancia singleton. El provider en la ruta crea **otra** instancia scoped. Esto genera confusión y puede causar bugs si algún servicio `providedIn: 'root'` (como `LoginUseCase`) resuelve una instancia diferente a la que la ruta provee.
- **Cómo solucionarlo:** Eliminar `providedIn: 'root'` de `AuthRepositoryImpl`. El binding `AuthRepository → AuthRepositoryImpl` **solo** debe existir en `auth.routes.ts`.

```diff
-@Injectable({ providedIn: 'root' })
+@Injectable()
 export class AuthRepositoryImpl implements AuthRepository {
```

> [!WARNING]
> `LoginUseCase` y `RefreshTokenUseCase` también son `providedIn: 'root'`. Si `AuthRepository` solo se provee en la ruta, estos use cases fallarán fuera del contexto de esa ruta. Necesitas decidir: o **todo** root, o **todo** scoped por ruta. Para auth, recomiendo root (es un singleton global), lo que significa **no** necesitas el provider en `auth.routes.ts`.

---

## 🟠 Problemas Importantes

### 6. `User` entity sin uso real (código muerto)

- **Archivo:** [auth-user.entity.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/domain/entities/auth-user.entity.ts)
- **Problema:** `User` (solo tiene `id` y `role`) no se usa en ningún archivo de la feature. El mapper `UserMapper` tampoco se invoca en ninguna parte. Los datos del usuario ya están contenidos en `Session`.
- **Por qué importa:** Código muerto incrementa la carga cognitiva y confunde sobre la responsabilidad de datos de usuario.
- **Cómo solucionarlo:** Eliminar `auth-user.entity.ts` y `auth-user.mapper.ts` a menos que haya un plan concreto de uso futuro.

---

### 7. `LoginResponseDto` con propiedades ambiguas (`accessToken` + `access`, `refreshToken` + `refresh`)

- **Archivo:** [infrastructure/dtos/auth-login-response.dto.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/dtos/auth-login-response.dto.ts)
- **Problema:** Tiene 4 propiedades opcionales para representar 2 tokens: `accessToken?`, `access?`, `refreshToken?`, `refresh?`. El mapper usa coalescing (`dto.accessToken ?? dto.access`).
- **Por qué importa:** Indica que el DTO intenta soportar múltiples versiones del API simultáneamente sin una estrategia explícita de versionado. Genera fragilidad y hace difícil de entender cuál es el contrato real.
- **Cómo solucionarlo:**
  1. Si el backend ha migrado, usar solo un set de nombres.
  2. Si se necesita compatibilidad, documentarlo explícitamente y crear un adapter/normalizer en el mapper.

---

### 8. `SessionMapper` tiene un `LegacySessionPrimitives` con typo (`accesExp`)

- **Archivo:** [auth-session.mapper.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/mappers/auth-session.mapper.ts#L17-L19)
- **Problema:** `LegacySessionPrimitives` maneja un typo histórico (`accesExp` vs `accessExp`). Estos datos legacy pueden vivir indefinidamente en localStorage de los usuarios.
- **Cómo solucionarlo:** Considerar agregar una versión al storage key (ej: `session_v2`) y eliminar soporte legacy tras un periodo de migración.

---

### 9. `AuthTokenRefreshOrchestrator` en infrastructure importa de application

- **Archivo:** [auth-token-refresh-orchestrator.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/http/auth-token-refresh-orchestrator.service.ts#L14-L15)
- **Problema:** `infrastructure` importa `SessionStateService` y `RefreshTokenUseCase` de `application`. En Clean Architecture, infrastructure implementa contratos de domain, no depende de application.
- **Por qué importa:** El orchestrator es un servicio de **application** que orquesta la lógica de refresh con el interceptor. Está mal ubicado en infrastructure.
- **Principio violado:** Clean Architecture Dependency Rule
- **Cómo solucionarlo:** Mover `AuthTokenRefreshOrchestrator` a `application/services/`. El interceptor (infrastructure) inyecta el orchestrator (application) — eso respeta la dependency rule: `infrastructure → application`.

---

### 10. Guard en presentation importa directamente de application

- **Archivo:** [auth.guard.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/presentation/guards/auth.guard.ts)
- **Problema arquitectural menor:** El skill de clean-architecture sugiere que guards pueden estar en `core/guards/`. Sin embargo, como este guard es específico del feature auth, la ubicación en `presentation/guards/` es aceptable.
- **Evaluación:** El guard delega toda la lógica a `SessionStateService` — no contiene lógica de negocio propia. ✅ Correcto.

---

### 11. `index.ts` barrel export expone demasiados internos

- **Archivo:** [index.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/index.ts)
- **Problema:** Exporta `LoginUseCase`, `RefreshTokenUseCase`, `AuthRepository` — artefactos internos que no deberían ser consumidos por otros features. El barrel debería exponer solo la API pública del feature.
- **Cómo solucionarlo:** Exportar únicamente lo que otros features necesitan:
```typescript
// Público
export { AuthFacade } from './application/facades/auth.facade';
export { Session } from './domain/entities/auth-session.entity';
export { UserRole } from './domain/value-objects/auth-user-role.enum';
export { AUTH_ROUTES } from './auth.routes';
// Solo si otros features necesitan el guard:
export { authGuard } from './presentation/guards/auth.guard';
```

---

### 12. `auth-endpoints.ts` falta `as const`

- **Archivo:** [auth-endpoints.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/config/auth-endpoints.ts)
- **Problema:** Sin `as const`, los valores se infieren como `string` en vez de string literals.
- **Cómo solucionarlo:**
```diff
 export const AUTH_ENDPOINTS = {
     LOGIN: '/login',
     REFRESH: '/refresh',
-}
+} as const;
```

---

## 🟡 Mejoras Recomendadas

### 13. `Session` entity tiene role checks hardcodeados

- **Archivo:** [auth-session.entity.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/domain/entities/auth-session.entity.ts#L14-L24)
- **Problema:** `isAdmin`, `isManager`, `isSeller` son getters hardcodeados. Si se agrega un nuevo rol, hay que modificar la entity.
- **Principio violado:** **Open/Closed (SOLID-O)**
- **Cómo solucionarlo:** Usar un método genérico:
```typescript
hasRole(role: UserRole): boolean {
  return this.role === role;
}
```

---

### 14. `LoginUseCase` no recibe opción `remember` para persistencia

- **Archivo:** [login.usecase.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/usecase/login.usecase.ts#L20)
- **Problema:** `setSession(session, { persist: true })` siempre persiste. La funcionalidad de "recordar sesión" existe en `SessionStateService` pero nunca se activa desde el login.
- **Cómo solucionarlo:** Pasar `remember` como parte del comando de login:
```typescript
execute(credentials: LoginCredentials, options?: { remember?: boolean }): Observable<Session> {
  ...
  this.sessionService.setSession(session, { persist: true, remember: options?.remember });
}
```

---

### 15. Test del `AuthFacade` tiene un `it.todo('logs out user')` incompleto

- **Archivo:** [auth.facade.spec.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/application/facades/auth.facade.spec.ts#L73)
- **Problema:** Test pendiente para una funcionalidad ya implementada.
- **Cómo solucionarlo:** Implementar el test.

---

### 16. `RefreshTokenUseCase` no tiene tests

- **Problema:** No existe `refresh.usecase.spec.ts`. Es un use case crítico para la seguridad de sesión.
- **Por qué importa:** El refresh flow es uno de los flujos más propensos a bugs sutiles (race conditions, loops infinitos, session clearing).
- **Cómo solucionarlo:** Crear tests para:
  - Refresh exitoso → session actualizada
  - Refresh token expirado → session cleared, error thrown
  - Sin refresh token → session cleared, error thrown
  - Error en el repository → session cleared, error propagated

---

### 17. `SessionMapper` tests ausentes

- **Problema:** No existe `auth-session.mapper.spec.ts`. El mapper contiene lógica de negocio (legacy migration, coalescing de fields).
- **Cómo solucionarlo:** Testear `fromLoginResponse`, `fromJSON` (con legacy data), `toJSON`.

---

### 18. `mapAuthUserRole` tiene lógica de negocio sin documentar

- **Archivo:** [auth-role.mapper.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/mappers/auth-role.mapper.ts)
- **Problema:** La combinación `isAdmin && isStaff → Admin` y `!isAdmin && isStaff → Manager` son reglas de negocio codificadas sin documentación ni test. ¿Qué pasa si `isAdmin && !isStaff`? Devuelve `Seller`, lo cual parece incorrecto.
- **Cómo solucionarlo:** Documentar la tabla de verdad y agregar tests unitarios. Considerar el caso `isAdmin && !isStaff`.

---

### 19. `Session.updateAccessToken()` constructor call con 7 parámetros

- **Archivo:** [auth-session.entity.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/domain/entities/auth-session.entity.ts#L30-L39)
- **Problema:** Constructor de `Session` recibe 7 parámetros posicionales — propenso a errores al cambiar el orden.
- **Cómo solucionarlo:** Usar un objeto de configuración o el patrón `fromPrimitives` sugerido arriba.

---

### 20. `auth-token-http.utils.ts` — `isRefreshRequest` usa `includes()` frágil

- **Archivo:** [auth-token-http.utils.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/features/auth/infrastructure/http/auth-token-http.utils.ts#L21-L23)
- **Problema:** `request.url.includes(AUTH_ENDPOINTS.REFRESH)` matchea cualquier URL que contenga `/refresh`, como `/api/products/refresh-stock`.
- **Cómo solucionarlo:** Comparar con la URL completa o usar `endsWith`:
```typescript
export function isRefreshRequest(request: HttpRequest<unknown>): boolean {
  return request.url.endsWith(AUTH_ENDPOINTS.REFRESH);
}
```

---

## 🟢 Buenas Prácticas Detectadas

| Elemento | Qué está bien | Por qué |
|---|---|---|
| `Session` entity | Comportamiento rico: `isAccessTokenExpired()`, `isRefreshTokenExpired()`, `updateAccessToken()` (inmutable) | Anti-patrón de dominio anémico evitado. Entidad con lógica de negocio real |
| `AuthFacade` | Responsabilidad acotada, estado privado con signals readonly, resolución tipada de errores | Sigue exactamente el patrón del skill `angular-clean-architecture` |
| `authTokenInterceptor` | Functional interceptor, delega todo al orchestrator, maneja 401 correctamente | Clean, no tiene lógica de negocio, detecta refresh loops |
| `AuthTokenRefreshOrchestrator` | `shareReplay` + `finalize()` para evitar race conditions | Patrón correcto de deduplicación de refresh requests |
| `auth.routes.ts` | DI scoped por ruta con `providers[]` | Sigue el skill de clean-architecture para binding abstraction → implementation |
| `LoginPageComponent` | `OnPush`, `standalone`, `inject()`, reactive forms tipados, `takeUntilDestroyed` | Cumple todos los puntos del checklist del skill `angular-best-practices` |
| Manejo de errores | Jerarquía de errores tipada (`AuthError`, `InvalidCredentialsError`, etc.) | Permite distinguir errores de dominio vs infraestructura |
| Test coverage interceptor | Tests cubren: attach token, pass through 500, abort refresh 401, retry on 401 | Escenarios críticos cubiertos |
| Test coverage orchestrator | Tests cubren: no session, attach token, retry flow, simultaneous refresh dedup, failure recovery | Excelente cobertura del flujo más complejo |

---

## 🚀 Recomendaciones de Arquitectura

### Pattern: Strategy para Role Resolution

Reemplazar `mapAuthUserRole` con un Strategy pattern si la lógica de roles crece:

```typescript
// domain/value-objects/role-resolver.strategy.ts
type RoleInput = { isAdmin: boolean; isStaff: boolean };
type RoleResolver = (input: RoleInput) => UserRole;

export const defaultRoleResolver: RoleResolver = ({ isAdmin, isStaff }) => {
  if (isAdmin) return UserRole.Admin;
  if (isStaff) return UserRole.Manager;
  return UserRole.Seller;
};
```

### Pattern: Command para Use Cases

Crear un `LoginCommand` en application en vez de reusar `LoginCredentials`:

```typescript
// application/commands/login.command.ts
export interface LoginCommand {
  username: string;
  password: string;
  remember?: boolean;
}
```

### Mejora estructural: Mover Orchestrator a Application

```
application/
├── services/
│   ├── session-state.service.ts
│   └── auth-token-refresh-orchestrator.service.ts  ← mover aquí
```

---

## 🧩 BONUS — Mejoras Específicas por Componente

### `auth.facade.ts`
- ✅ Bien diseñado. Única mejora: aceptar `remember` como parámetro del `login()` y pasarlo al use case.

### `session-state.service.ts`
- 🔴 **Eliminar import de `SessionMapper`** (infrastructure). Usar `Session.toPrimitives()` / `Session.fromPrimitives()`.
- 🟡 `getSession()` es redundante con `session()` (signal readonly). Considerar eliminar el método y que los consumidores lean el signal directamente.

### `login.usecase.ts`
- 🟡 Aceptar `options?: { remember?: boolean }` para pasar a `sessionService.setSession()`.

### `refresh.usecase.ts`
- 🔴 **Cambiar `LoggerService` por `LOGGER_PORT`** — inconsistencia crítica.
- 🟡 No tiene tests — agregar `refresh.usecase.spec.ts`.

### `auth-token.interceptor.ts`
- ✅ Correcto. Sin cambios necesarios.

### `auth-token-refresh-orchestrator.service.ts`
- 🟠 **Mover a `application/services/`** — no es infrastructure, es orquestación de lógica de aplicación.

### `auth-repository.impl.ts`
- 🟠 **Quitar `providedIn: 'root'`** — el binding se hace en `auth.routes.ts`.

### `auth.guard.ts`
- ✅ Correcto. Delega completamente a `SessionStateService`, no contiene lógica de negocio.

### `auth-session.entity.ts`
- 🟡 Agregar `fromPrimitives()` / `toPrimitives()` para romper dependencia de `SessionMapper`.
- 🟡 Reemplazar role checks hardcodeados con `hasRole(role)` genérico.
- 🟡 Considerar un builder o config object para el constructor de 7 params.

---

## 📊 Resumen de Severidad

| Severidad | Cantidad | Más crítico |
|---|---|---|
| 🔴 Crítico | 5 | SessionStateService → infrastructure dependency |
| 🟠 Importante | 7 | DTOs duplicados, Provider scope collision |
| 🟡 Mejora | 8 | Session constructor, isRefreshRequest fragile |
| ✅ Bueno | 9 | Entity rica, interceptor clean, tests orchestrator |
