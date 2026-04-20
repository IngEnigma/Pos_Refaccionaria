# 🔍 Auditoría Profunda — Módulo `/src/app/core`

> **Archivos analizados:** 39 (source + tests)  
> **Subdirectorios:** `config`, `http/error`, `http/retry`, `interceptors`, `logging`, `ports`, `search`, `services`, `tokens`, `utils`  
> **Estándares de referencia:** Skills de `angular-clean-architecture`, `angular-best-practices`, `angular-state-management`, `angular-testing`

---

## 🔴 Problemas Críticos

### 1. Código duplicado: `url-sanitizer.ts` vs `url-sanitizer.service.ts`

- **Archivos:** [url-sanitizer.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/utils/url-sanitizer.ts) y [url-sanitizer.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/utils/url-sanitizer.service.ts)
- **Problema:** Existen **dos implementaciones casi idénticas** de la misma funcionalidad: una función pura (`sanitizeUrlParams`) y un servicio Angular (`UrlSanitizerService`), ambas con la misma constante `SENSITIVE_QUERY_PARAMS` duplicada.
- **Por qué es un problema:** Violar DRY genera inconsistencias. Si se añade un parámetro sensible a una versión, se puede olvidar en la otra. Además, el servicio usa `inject(DOCUMENT)` para `location.origin` mientras la función pura usa `'http://localhost'` hardcoded — comportamientos divergentes.
- **Qué principio viola:** **DRY**, **SRP** (dos unidades para la misma responsabilidad)
- **Cómo solucionarlo:** Eliminar `url-sanitizer.ts` y usar **solo** `UrlSanitizerService`. Si necesitas una función pura para tests, extraer la lógica core a una función interna y que el servicio la delegue:

```typescript
// utils/url-sanitizer.utils.ts — función pura reutilizable
export function sanitizeUrlParams(url: string, baseUrl?: string): string { /* ... */ }

// utils/url-sanitizer.service.ts — wrapper Angular
@Injectable({ providedIn: 'root' })
export class UrlSanitizerService {
  private readonly document = inject(DOCUMENT);
  sanitizeUrlParams(url: string): string {
    return sanitizeUrlParams(url, this.document.location.origin);
  }
}
```

---

### 2. `LOGGER_PORT` sin `factory` — error en runtime si se olvida proveer

- **Archivo:** [logger.port.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/logging/logger.port.ts)
- **Problema:** El `InjectionToken` `LOGGER_PORT` se define **sin factory ni providedIn**, lo que significa que cada consumidor que use `inject(LOGGER_PORT)` fallará con `NullInjectorError` si no se registra manualmente en `app.config.ts`.
- **Por qué es un problema:** Múltiples servicios (`HttpErrorHandlerService`, `RetryStrategyService`, `InMemoryStorageService`, `LocalStorageService`) dependen de `LOGGER_PORT`. Un olvido en la configuración rompe toda la app en runtime. No hay **fail-fast** en compile time.
- **Qué principio viola:** **D (Dependency Inversion)** — el token existe pero no tiene default binding
- **Cómo solucionarlo:** Añadir una factory default al token:

```typescript
export const LOGGER_PORT = new InjectionToken<LoggerPort>('LOGGER_PORT', {
  providedIn: 'root',
  factory: () => inject(LoggerService),
});
```

---

### 3. `storage.provider.ts` usa `new` directamente, saltándose DI

- **Archivo:** [storage.provider.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/ports/storage.provider.ts)
- **Problema:** `provideStorage()` instancia `new LocalStorageService()` y `new InMemoryStorageService()` directamente. Ambos servicios usan `inject()` en su constructor (LOGGER_PORT, LOCAL_STORAGE), lo cual **falla fuera del contexto de inyección**.
- **Por qué es un problema:** `inject()` solo funciona dentro del contexto de DI. Crear instancias con `new` lanza `Error: inject() must be called from an injection context`. Esto es un **bug silencioso** que solo falla en runtime.
- **Qué principio viola:** **D (Dependency Inversion)**, patrón de **DI de Angular**
- **Cómo solucionarlo:**

```typescript
import { inject, PLATFORM_ID, Provider } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const provideStorage = (): Provider => ({
  provide: STORAGE_PORT,
  useFactory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      try {
        window.localStorage.setItem('__test__', '1');
        window.localStorage.removeItem('__test__');
        return inject(LocalStorageService);
      } catch {
        return inject(InMemoryStorageService);  
      }
    }
    return inject(InMemoryStorageService);
  },
});
```

---

### 4. `LOCAL_STORAGE` token accede a `window.localStorage` directamente — SSR incompatible

- **Archivo:** [storage.token.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/tokens/storage.token.ts)
- **Problema:** La factory usa `window.localStorage` sin verificar si está en browser. En SSR esto lanza `ReferenceError: window is not defined`.
- **Qué principio viola:** **Portabilidad**, principio de **diseño defensivo**
- **Cómo solucionarlo:**

```typescript
export const LOCAL_STORAGE = new InjectionToken<Storage>('LOCAL_STORAGE', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
      return window.localStorage;
    }
    return undefined as unknown as Storage; // O un NoopStorage
  },
});
```

---

## 🟠 Problemas Importantes

### 5. `as any` en `retry.strategy.ts` — pérdida de type safety

- **Archivo:** [retry.strategy.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.strategy.ts#L29)
- **Problema:** En línea 29 se usa `(error as any).status` dentro del callback `delay`. `error` ya fue validado como `HttpErrorResponse` por `canRetryRequest`, pero el cast `as any` anula la protección.
- **Qué principio viola:** **Type Safety**, skill de best-practices (no usar `any`)
- **Cómo solucionarlo:** Aprovechar el type guard de `canRetryRequest`:

```typescript
delay: (error: unknown, retryCount: number): Observable<number> => {
  if (!canRetryRequest(req.method, error)) {
    return throwError(() => error);
  }
  // Aquí error ya es HttpErrorResponse gracias al type guard
  this.logger.warn(`Retrying request (${retryCount})`, {
    url: req.url,
    status: error.status, // ✅ sin cast
  });
  // ...
}
```

---

### 6. `RETRYABLE_CODES_STATUSES.includes()` con type mismatch

- **Archivo:** [retry.utils.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.utils.ts#L14)
- **Problema:** `RETRYABLE_CODES_STATUSES` es un `readonly` tuple (`as const`). Llamar `.includes(error.status)` donde `error.status` es `number` genera un error de tipos en `strict` mode porque TypeScript no permite comprobar si un `number` está en un `readonly [0, 502, 503, 504]`.
- **Por qué es un problema:** Con `strict: true` (requerido por skill de best-practices), esto puede generar error TS2345.
- **Cómo solucionarlo:**

```typescript
const isRetryableStatus = (RETRYABLE_CODES_STATUSES as readonly number[]).includes(error.status);
```

---

### 7. `PERSISTENT_STORAGE_PORT` definido pero nunca proveído ni usado

- **Archivo:** [persistent-storage.port.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/ports/persistent-storage.port.ts)
- **Problema:** Se define el token `PERSISTENT_STORAGE_PORT` pero no tiene factory, no se registra en ningún provider, y ningún servicio lo inyecta. Es código muerto.
- **Qué principio viola:** **YAGNI**, limpieza del módulo
- **Cómo solucionarlo:** Eliminar el archivo o implementar su uso.

---

### 8. `API_ENDPOINTS` vacío — config muerta

- **Archivo:** [api-endpoints.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/config/api-endpoints.ts)
- **Problema:** El objeto está vacío (solo un comentario). En auditorías previas se migraron los endpoints a las features, pero este archivo sigue existiendo sin contenido útil.
- **Cómo solucionarlo:** Eliminar, o si se necesita un `BASE_URL` global, implementar:

```typescript
export const API_ENDPOINTS = {
  BASE_URL: '', // Se resuelve via AppSettingsService
} as const;
```

---

### 9. `dummy.spec.ts` — test placeholder sin valor

- **Archivo:** [dummy.spec.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/dummy.spec.ts)
- **Problema:** Un test que solo verifica que `DummyService` es truthy. No aporta cobertura real. Incluye un servicio `@Injectable({providedIn: 'root'})` que es dead code.
- **Cómo solucionarlo:** Eliminar el archivo.

---

### 10. `RetryConfig` type derivado de valor runtime

- **Archivo:** [retry-config.token.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry-config.token.ts#L4)
- **Problema:** `RetryConfig = typeof HTTP_RETRY_CONFIG` acopla el tipo a la implementación concreta en vez de definirlo como interfaz independiente. Si el config cambia de shape, el tipo cambia sin alerta.
- **Qué principio viola:** **O (Open/Closed)** — no es fácil extender con campos opcionales
- **Cómo solucionarlo:**

```typescript
export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
}
```

---

### 11. `canRetryRequest` solo permite retries en `GET`

- **Archivo:** [retry.utils.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.utils.ts#L13)
- **Problema:** Hardcodea que solo `GET` puede hacer retry. Esto podría necesitar extensión para `HEAD` u operaciones idempotentes como `PUT`. No hay mecanismo para configurarlo.
- **Qué principio viola:** **O (Open/Closed)**
- **Cómo solucionarlo:** Hacer configurable los métodos retryable:

```typescript
// http-retry.config.ts
export const HTTP_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 500,
  retryableMethods: ['GET', 'HEAD'] as readonly string[],
} as const;
```

---

## 🟡 Mejoras Recomendadas

### 12. Logging excesivo en storage services

- **Archivos:** [local-storage.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/services/local-storage.service.ts), [in-memory-storage.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/services/in-memory-storage.service.ts)
- **Problema:** Cada `getItem`, `setItem`, `removeItem` genera un log. En apps con acceso frecuente a storage, esto inunda la consola de DEBUG/INFO logs innecesarios.
- **Cómo solucionarlo:** Reducir a un solo log level (`debug`) y solo logear errores con nivel `error`. Omitir logs de operaciones exitosas, o al menos solo logearlas en `DEBUG` y asegurar que `loggingLevel` en prod sea `WARN+`.

---

### 13. `ConsoleLoggerAdapter` formato plano sin estructura

- **Archivo:** [console-logger.adapter.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/logging/console-logger.adapter.ts)
- **Problema:** El formato es un string plano concatenado. En DevTools, `JSON.stringify(data)` produce strings difíciles de inspeccionar. Además no usa `console.debug` para `LogLevel.DEBUG`.
- **Cómo solucionarlo:**

```typescript
log(entry: LogEntry): void {
  const prefix = `[${LogLevel[entry.level]}]${entry.context ? ` (${entry.context})` : ''}`;
  const args: unknown[] = [prefix, entry.message];
  if (entry.data) args.push(entry.data); // objeto nativo, no stringified

  switch (entry.level) {
    case LogLevel.DEBUG: console.debug(...args); break;
    case LogLevel.INFO:  console.info(...args);  break;
    case LogLevel.WARN:  console.warn(...args);  break;
    case LogLevel.ERROR:
    case LogLevel.FATAL: console.error(...args);  break;
  }
}
```

---

### 14. `LoggerService.withContext()` retorna un plain object, no una instancia

- **Archivo:** [logger.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/logging/logger.service.ts#L60-L69)
- **Problema:** `withContext()` retorna un literal object que implementa `LoggerPort`, pero pierde acceso a métodos internos y no es testeable como instancia. Además, destruye la igualdad referencial si se necesita.
- **Cómo solucionarlo:** Crear una clase interna `ContextualLogger`:

```typescript
class ContextualLogger implements LoggerPort {
  constructor(private parent: LoggerService, private context: string) {}
  debug(msg: string, data?: unknown) { this.parent['log'](LogLevel.DEBUG, msg, data, this.context); }
  // ... etc
  withContext(sub: string): LoggerPort { return new ContextualLogger(this.parent, `${this.context}:${sub}`); }
}
```

---

### 15. `getExponentialBackoffDelay` sin jitter — thundering herd problem

- **Archivo:** [retry.utils.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.utils.ts#L19-L24)
- **Problema:** Sin jitter, múltiples clientes en retry sincronizarán sus reintentos, amplificando la carga en el servidor.
- **Cómo solucionarlo:**

```typescript
export function getExponentialBackoffDelay(retryCount: number, baseDelayMs: number): number {
  const exponential = Math.pow(2, retryCount) * baseDelayMs;
  const jitter = Math.random() * baseDelayMs;
  return exponential + jitter;
}
```

---

### 16. `SearchStrategy` interface sin InjectionToken ni implementaciones

- **Archivo:** [search.strategy.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/search/search.strategy.ts)
- **Problema:** Se define la interfaz `SearchStrategy<T>` pero no hay InjectionToken, no hay implementaciones, y `GlobalSearchService` no la usa.
- **Cómo solucionarlo:** O implementar el patrón Strategy con un token:

```typescript
export const SEARCH_STRATEGY = new InjectionToken<SearchStrategy<unknown>>('SEARCH_STRATEGY');
```

O eliminar si no se usa.

---

### 17. `GlobalSearchService` sin debounce ni filtrado

- **Archivo:** [global-search.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/search/global-search.service.ts)
- **Problema:** Solo almacena un string. No hay debounce, sanitización de input, ni length mínimo. Sin tests.
- **Cómo solucionarlo:** Considerar si realmente pertenece a `core` (parece application-level).

---

## 🧪 Testing — Problemas Detectados

### Tests ausentes (cobertura crítica faltante)

| Archivo | Tests |
|---|---|
| [in-memory-storage.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/services/in-memory-storage.service.ts) | ❌ Sin spec |
| [console-logger.adapter.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/logging/console-logger.adapter.ts) | ❌ Sin spec |
| [global-search.service.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/search/global-search.service.ts) | ❌ Sin spec |
| [app-settings.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/config/app-settings.ts) | ❌ Sin spec |
| [storage.provider.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/ports/storage.provider.ts) | ❌ Sin spec |

### Problemas en tests existentes

| Test | Problema |
|---|---|
| [retry.strategy.spec.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.strategy.spec.ts#L57) | Línea 57: `expect(strategy.count).toBe(2)` con comentario "picking up the real config (2) instead of the mock (3)" — indica que el mock del `RETRY_CONFIG` no aplica correctamente. La factory del token se ejecuta antes del override. |
| [retry.utils.spec.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/http/retry/retry.utils.spec.ts#L21) | Línea 21: `(error as any)` — usa `as any` en test, innecesario porque `HttpErrorResponse` ya satisface el type. |
| [url-sanitizer.spec.ts](file:///home/enigma/Documentos/Refaccionaria/FrontTRT/src/app/core/utils/url-sanitizer.spec.ts#L48-L52) | El test de "malformed URLs" está vacío (sin assertions). Debe testear el path de `catch`. |
| Todos los test files: `loggerMock: any` | Múltiples tests usan `any` para mocks en vez de tipado parcial (`jest.Mocked<Partial<LoggerPort>>`) |

---

## 🟢 Buenas Prácticas Detectadas

| Qué está bien | Por qué |
|---|---|
| **Interceptor funcional** (`HttpInterceptorFn`) | Sigue el patrón moderno de Angular 17+. Delega responsabilidades correctamente a `RetryStrategyService` y `HttpErrorHandlerService`. |
| **Port/Adapter pattern en logging** | `LoggerPort` → `LoggerAdapter` → `ConsoleLoggerAdapter` es una implementación limpia del patrón hexagonal. Permite añadir adapters (Sentry, Datadog) sin tocar `LoggerService`. |
| **`StoragePort` como abstracción** | Desacopla el almacenamiento de la implementación. `LocalStorageService` e `InMemoryStorageService` son intercambiables. |
| **`buildHttpErrorLog` como función pura** | Separar el building del log del handling es buen SRP. Fácil de testear sin DI. |
| **`RETRY_COUNT` como `HttpContextToken`** | Permite configurar retries por request individual. Patrón avanzado y correcto. |
| **`LOGGER_ADAPTERS` como multi-adapter** | Permite registrar múltiples adapters (console + remote) via el token. |
| **`UrlSanitizerService` redacta params sensibles** | Protege contra logging de tokens/passwords en URLs. Buen security pattern. |
| **Tests de `buildHttpErrorLog`, `retryUtils`, `JwtUtils`** | Tests de funciones puras bien escritos, con edge cases cubiertos. |
| **`LoggerService.withContext()`** | El patrón de context scoping es enterprise-grade. Permite distinguir logs por origen. |
| **`getJSON`/`setJSON` en storage** | Abstrae la serialización y maneja errores de parsing. |

---

## 🚀 Recomendaciones de Arquitectura

### 1. Reorganizar `utils/` — Separar utils puros de servicios Angular

```
core/
├── utils/
│   ├── jwt.utils.ts           ← función pura (OK)
│   └── url-sanitizer.utils.ts ← función pura (renombrar)
├── services/
│   ├── url-sanitizer.service.ts ← mover aquí (usa inject)
│   ├── local-storage.service.ts
│   └── in-memory-storage.service.ts
```

> **Principio:** `utils/` solo debe contener funciones puras sin DI. Los servicios con `inject()` van en `services/`.

### 2. Implementar patrón **Facade** para core

Crear un `CoreFacade` que exponga las APIs del core de forma coordinada:

```typescript
@Injectable({ providedIn: 'root' })
export class CoreFacade {
  readonly logger = inject(LOGGER_PORT);
  readonly storage = inject(STORAGE_PORT);
  readonly settings = inject(AppSettingsService);
  readonly search = inject(GlobalSearchService);
}
```

### 3. Implementar patrón **Strategy** para retry

Definir `RetryStrategy` como interface inyectable para permitir diferentes estrategias (fixed, exponential, exponential+jitter):

```typescript
export interface RetryStrategy {
  getDelay(retryCount: number): number;
  canRetry(method: string, error: unknown): boolean;
}
```

### 4. Añadir barrel files (`index.ts`)

El módulo `core/` carece de barrel files. Añadir:
- `core/logging/index.ts` — exportar `LOGGER_PORT`, `LogLevel`, `LogEntry`
- `core/ports/index.ts` — exportar `StoragePort`, `STORAGE_PORT`
- `core/http/index.ts` — exportar `httpErrorInterceptor`, `RETRY_COUNT`

### 5. Centralizar providers en un `provideCore()` function

```typescript
// core/provide-core.ts
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideStorage(),
    { provide: LOGGER_PORT, useExisting: LoggerService },
    // ... otros providers globales
  ]);
}
```

---

## 🧩 BONUS — Mejoras Específicas

### `http-error.interceptor`

- ✅ Bien: funcional, delega correctamente
- ⚠️ Mejora: Añadir soporte para **ignorar** interceptor en requests específicos via `HttpContext`:

```typescript
export const SKIP_ERROR_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_ERROR_INTERCEPTOR)) {
    return next(req);
  }
  // ... resto igual
};
```

### `retry.strategy`

- 🔴 Eliminar `as any` (problema #5)
- 🟡 Añadir jitter al delay (problema #15)
- 🟡 Hacer `retryableMethods` configurable (problema #11)
- 🟡 Añadir `maxDelay` cap para evitar delays extremadamente largos:

```typescript
export const HTTP_RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 10000,  // Cap
  retryableMethods: ['GET', 'HEAD'],
} as const;
```

### `logger.service`

- 🟡 Usar `ContextualLogger` class en vez de literal object (problema #14)
- 🟡 Inyectar `DateProvider` en vez de `new Date()` para testability
- 🟡 Considerar `console.debug` para `LogLevel.DEBUG` (problema #13)
- 🟡 Añadir soporte para `ErrorLike` serialization:

```typescript
private serializeData(data: unknown): unknown {
  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack };
  }
  return data;
}
```

### Storage services

- 🔴 Corregir `storage.provider.ts` para usar `inject()` en vez de `new` (problema #3)
- 🔴 Corregir `LOCAL_STORAGE` token para SSR (problema #4)
- 🟡 Reducir verbosidad de logs (problema #12)
- 🟡 Añadir test para `InMemoryStorageService`
- 🟡 Considerar añadir `clear()` al interface `StoragePort` para completar la API
- 🟡 Considerar añadir `has(key: string): boolean` para evitar `getItem() !== null` patterns

---

## 📊 Resumen de Hallazgos

| Severidad | Count | Archivos más afectados |
|---|---|---|
| 🔴 Críticos | 4 | `storage.provider.ts`, `url-sanitizer*`, `logger.port.ts`, `storage.token.ts` |
| 🟠 Importantes | 7 | `retry.strategy.ts`, `retry.utils.ts`, `persistent-storage.port.ts`, `api-endpoints.ts`, `dummy.spec.ts` |
| 🟡 Mejoras | 6 | Logging verboso, formatter del adapter, jitter, search strategy |
| 🧪 Test gaps | 5 specs faltantes, 4 issues en specs existentes | |
