---
name: Angular Clean Architecture
description: Use when designing, auditing, or refactoring Angular projects to follow Clean Architecture principles such as separation of concerns, feature-based structure, domain boundaries, dependency rules, and scalable folder organization.
---

# Skill: Angular Clean Architecture

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
│   │   │   └── interceptors/
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
│   │       │   └── use-cases/
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
2. **Infrastructure** → Implementa interfaces del Domain
3. **Application (Facade)** → Orquesta casos de uso, expone estado readonly
4. **Presentation** → Solo UI, delega TODA la lógica al Facade
5. **Las dependencias apuntan hacia adentro**: Presentation → Application → Domain ← Infrastructure

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
  Admin = "admin",
  Viewer = "viewer",
}

// Caso de uso abstracto (contrato)
export abstract class GetUsersUseCase {
  abstract execute(filters?: UserFilters): Observable<User[]>;
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
    return this.http.get<UserDTO[]>("/api/users", { params: { ...filters } }).pipe(map((dtos) => dtos.map(UserMapper.toDomain)));
  }
}

// Mapper
export class UserMapper {
  static toDomain(dto: UserDTO): User {
    return {
      id: dto.id,
      name: `${dto.first_name} ${dto.last_name}`,
      email: dto.email_address,
      role: dto.is_admin ? UserRole.Admin : UserRole.Viewer,
    };
  }
}
```

---

## Facade en Application

```typescript
// features/users/application/user.facade.ts
@Injectable({ providedIn: "root" })
export class UserFacade {
  private repo = inject(GetUsersUseCase);

  // Estado privado con signals
  private _users = signal<User[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Exponer solo como readonly
  users = this._users.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  // Computados
  totalUsers = computed(() => this._users().length);

  loadUsers(filters?: UserFilters): void {
    this._loading.set(true);
    this._error.set(null);
    this.repo
      .execute(filters)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (users) => this._users.set(users),
        error: (err) => this._error.set(err.message),
      });
  }
}
```

---

## Smart Component (container) en Presentation

```typescript
// Solo delega al Facade — NUNCA lógica de negocio aquí
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <app-user-list [users]="facade.users()" [loading]="facade.loading()" (userSelected)="onSelect($event)" /> `,
})
export class UsersPageComponent {
  facade = inject(UserFacade);
  private router = inject(Router);

  ngOnInit(): void {
    this.facade.loadUsers();
  }
  onSelect(user: User): void {
    this.router.navigate(["/users", user.id]);
  }
}
```

---

## Lazy Loading y DI scoped por feature

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: "users",
    loadChildren: () => import("./features/users/users.routes").then((m) => m.USER_ROUTES),
  },
];

// features/users/users.routes.ts
export const USER_ROUTES: Routes = [
  {
    path: "",
    providers: [{ provide: GetUsersUseCase, useClass: UserRepository }],
    children: [
      { path: "", component: UsersPageComponent },
      { path: ":id", component: UserDetailPageComponent },
    ],
  },
];
```

---

## Barrel Files y Path Aliases

```typescript
// features/users/index.ts — solo exporta lo público
export { UserFacade } from "./application/user.facade";
export { User, UserRole } from "./domain/models/user.model";
export { UsersPageComponent } from "./presentation/pages/users-page.component";
```

```json
// tsconfig.json — path aliases
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"]
    }
  }
}
```
