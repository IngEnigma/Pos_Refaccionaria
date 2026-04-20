---
name: Angular Clean Architecture
description: Use when designing, auditing, or refactoring Angular projects to follow Clean Architecture principles such as separation of concerns, feature-based structure, domain boundaries, dependency rules, and scalable folder organization. Compatible with Angular 17+.
---

# Skill: Angular Clean Architecture
> Angular 17+ | Aplica al diseñar, auditar o refactorizar estructura de proyectos

## Cuándo aplicar este skill

Aplica este skill cuando:

- Se cree o reestructure un proyecto Angular
- Se agreguen nuevas features o módulos
- Se detecte lógica de negocio en componentes
- Se pidan servicios, repositorios o facades
- El usuario mencione "arquitectura", "estructura de carpetas", "clean architecture", "domain"

---

## Estructura de Carpetas Obligatoria

```
src/
├── app/
│   ├── core/                        # Singletons globales (una sola instancia)
│   │   ├── auth/
│   │   ├── http/
│   │   │   └── interceptors/        # Auth, logging, error, retry
│   │   ├── errors/                  # GlobalErrorHandler
│   │   └── guards/
│   │
│   ├── shared/                      # UI reutilizable sin lógica de negocio
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   │
│   ├── features/                    # Un directorio por dominio de negocio
│   │   └── [feature]/
│   │       ├── domain/              # Modelos, interfaces, casos de uso abstractos
│   │       │   ├── models/
│   │       │   └── use-cases/       # Contratos abstractos (abstract class)
│   │       ├── application/         # Facades, DTOs, mappers
│   │       │   └── [feature].facade.ts
│   │       ├── infrastructure/      # Implementaciones HTTP, storage
│   │       │   └── [feature].repository.ts
│   │       └── presentation/        # Componentes, páginas, rutas
│   │           ├── pages/
│   │           ├── components/
│   │           └── [feature].routes.ts
│   │
│   ├── app.config.ts
│   └── app.routes.ts
└── environments/
```

---

## Reglas de capas (SIEMPRE respetar)

1. **Domain** → No importa nada de Angular (sin HttpClient, sin inject)
2. **Infrastructure** → Implementa interfaces del Domain; solo importa de Domain
3. **Application (Facade)** → Orquesta casos de uso, expone estado readonly
4. **Presentation** → Solo UI, delega TODA la lógica al Facade
5. **Las dependencias apuntan hacia adentro**: Presentation → Application → Domain ← Infrastructure

> ⚠️ Violación común: importar `HttpClient` directamente en un Facade o componente.
> Siempre debe pasar por el Repository.

---

## Modelos en Domain

```typescript
// features/users/domain/models/user.model.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  Admin  = 'admin',
  Viewer = 'viewer',
}

// Filtros tipados
export interface UserFilters {
  role?: UserRole;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Caso de uso abstracto (contrato) — NO importa Angular
export abstract class GetUsersUseCase {
  abstract execute(filters?: UserFilters): Observable<User[]>;
}

export abstract class CreateUserUseCase {
  abstract execute(data: CreateUserDto): Observable<User>;
}
```

---

## Repository en Infrastructure

```typescript
// features/users/infrastructure/user.repository.ts
@Injectable()
export class UserRepository extends GetUsersUseCase {
  private http = inject(HttpClient);

  execute(filters?: UserFilters): Observable<User[]> {
    return this.http
      .get<UserDTO[]>('/api/users', { params: { ...filters } })
      .pipe(map(dtos => dtos.map(UserMapper.toDomain)));
  }
}

// Mapper — transforma DTO (API) → Domain model
export class UserMapper {
  static toDomain(dto: UserDTO): User {
    return {
      id:    dto.id,
      name:  `${dto.first_name} ${dto.last_name}`,
      email: dto.email_address,
      role:  dto.is_admin ? UserRole.Admin : UserRole.Viewer,
    };
  }

  static toDTO(user: Partial<User>): Partial<UserDTO> {
    return {
      first_name:    user.name?.split(' ')[0],
      last_name:     user.name?.split(' ')[1],
      email_address: user.email,
      is_admin:      user.role === UserRole.Admin,
    };
  }
}
```

---

## Facade en Application

```typescript
// features/users/application/user.facade.ts
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private repo = inject(GetUsersUseCase);

  // Estado privado con signals
  private _users   = signal<User[]>([]);
  private _loading = signal(false);
  private _error   = signal<string | null>(null);

  // Exponer solo como readonly
  users   = this._users.asReadonly();
  loading = this._loading.asReadonly();
  error   = this._error.asReadonly();

  // Computados
  totalUsers    = computed(() => this._users().length);
  adminCount    = computed(() => this._users().filter(u => u.role === UserRole.Admin).length);
  hasError      = computed(() => this._error() !== null);

  loadUsers(filters?: UserFilters): void {
    this._loading.set(true);
    this._error.set(null);
    this.repo.execute(filters).pipe(
      finalize(() => this._loading.set(false))
    ).subscribe({
      next:  users => this._users.set(users),
      error: err   => this._error.set(err.message),
    });
  }
}

// ✅ Variante moderna con resource() (Angular 19+)
// Ver skill: angular-resource-pattern
```

---

## Smart Component (container) en Presentation

```typescript
// Solo delega al Facade — NUNCA lógica de negocio aquí
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-user-list
      [users]="facade.users()"
      [loading]="facade.loading()"
      (userSelected)="onSelect($event)"
    />
    @if (facade.hasError()) {
      <app-error-banner [message]="facade.error()!" />
    }
  `,
})
export class UsersPageComponent {
  facade = inject(UserFacade);
  private router = inject(Router);

  ngOnInit(): void { this.facade.loadUsers(); }

  onSelect(user: User): void {
    this.router.navigate(['/users', user.id]);
  }
}
```

---

## Manejo de Errores Global

```typescript
// core/errors/global-error-handler.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toastService  = inject(ToastService);
  private logger        = inject(LoggerService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Error inesperado';

    // Loggear siempre
    this.logger.error(error);

    // Notificar al usuario (sin detalles técnicos)
    this.toastService.error('Ocurrió un error. Por favor intenta de nuevo.');

    // No re-lanzar — ya fue capturado
    console.error(error); // solo en desarrollo
  }
}

// Registrar en app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ]
};
```

---

## InjectionToken para configuración por feature

```typescript
// features/users/domain/user.config.ts
export interface UserModuleConfig {
  apiUrl: string;
  pageSize: number;
  enableAuditLog: boolean;
}

export const USER_CONFIG = new InjectionToken<UserModuleConfig>('USER_CONFIG', {
  factory: () => ({
    apiUrl: '/api/users',
    pageSize: 20,
    enableAuditLog: false,
  }),
});

// Usar en el repository
@Injectable()
export class UserRepository extends GetUsersUseCase {
  private http   = inject(HttpClient);
  private config = inject(USER_CONFIG);

  execute(filters?: UserFilters): Observable<User[]> {
    return this.http.get<UserDTO[]>(this.config.apiUrl, {
      params: { pageSize: this.config.pageSize, ...filters }
    }).pipe(map(dtos => dtos.map(UserMapper.toDomain)));
  }
}

// Sobreescribir configuración en la ruta (scoped)
export const USER_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: GetUsersUseCase, useClass: UserRepository },
    { provide: USER_CONFIG, useValue: { apiUrl: '/api/v2/users', pageSize: 50, enableAuditLog: true } },
  ],
  children: [
    { path: '', component: UsersPageComponent },
  ],
}];
```

---

## Interceptors en Core

```typescript
// core/http/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};

// core/http/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) router.navigate(['/login']);
      if (error.status === 403) router.navigate(['/forbidden']);
      return throwError(() => error);
    })
  );
};

// Regla: cuándo crear un nuevo interceptor
// ✅ Auth token          → authInterceptor
// ✅ Logging de requests → loggingInterceptor
// ✅ Errores globales    → errorInterceptor
// ✅ Retry automático    → retryInterceptor
// ❌ Lógica de negocio  → NUNCA en un interceptor

// Registrar en app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
  ]
};
```

---

## Lazy Loading y DI scoped por feature

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'users',
    loadChildren: () =>
      import('./features/users/users.routes').then(m => m.USER_ROUTES),
  },
];

// features/users/users.routes.ts
export const USER_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: GetUsersUseCase, useClass: UserRepository },
    { provide: USER_CONFIG, useValue: { apiUrl: '/api/users', pageSize: 20, enableAuditLog: false } },
  ],
  children: [
    { path: '',    component: UsersPageComponent },
    { path: ':id', component: UserDetailPageComponent },
  ],
}];
```

---

## Barrel Files — Reglas de exportación

```typescript
// features/users/index.ts — solo exporta la API pública de la feature
// ✅ Exportar: lo que otros módulos necesitan
export { UserFacade }           from './application/user.facade';
export { User, UserRole }       from './domain/models/user.model';
export { UsersPageComponent }   from './presentation/pages/users-page.component';

// ❌ NO exportar: detalles de implementación interna
// export { UserRepository }    // infraestructura — interno
// export { UserMapper }        // detalle de implementación
// export { UserDTO }           // DTO de API — interno
```

> ⚠️ Regla de las barrel files: exportar solo lo que otros features o el core
> necesitan consumir. Las implementaciones internas nunca se exportan.
> Las importaciones circulares casi siempre son síntoma de barrel files que
> exponen demasiado.

---

## Path Aliases en tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*":     ["src/app/core/*"],
      "@shared/*":   ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"]
    }
  }
}
```

---

## Errores comunes en code review

| Error | Por qué es problema | Solución |
|-------|---------------------|----------|
| `HttpClient` en un Facade | Viola separación de capas | Mover al Repository |
| Lógica de negocio en componente | Imposible testear aislado | Mover al Facade |
| Barrel file exporta el Repository | Expone detalles de infraestructura | Exportar solo el UseCase abstracto |
| `ErrorHandler` no registrado | Errores silenciosos en producción | Registrar `GlobalErrorHandler` |
| Sin `InjectionToken` para config | Config hardcodeada, no testeable | Extraer a token con factory |
| Importar desde otra feature directamente | Acoplamiento entre features | Importar solo desde el `index.ts` público |
