import {
  ApplicationConfig,
  computed,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authTokenInterceptor } from '@features/auth/infrastructure/http/auth-token.interceptor';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { PERSISTENT_STORAGE_PORT, STORAGE_PORT } from '@core/ports/storage.port';
import { InMemoryStorageService } from '@core/services/in-memory-storage.service';
import { LocalStorageService } from '@core/services/local-storage.service';
import { APP_ENV } from '@core/tokens/app-env.token';
import { environment } from '@env/environment';
import { Environment } from '@env/environment.model';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { ProfileRepositoryImpl } from '@features/auth/infrastructure/repositories/profile-repository.impl';
import { AuthFacade } from '@features/auth';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleDetailRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-detail-repository.impl';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-repository.impl';
import { PaymentMethodRepository } from '@features/sales/domain/repository/payment-method-repository';
import { PaymentMethodRepositoryImpl } from '@features/sales/infrastructure/repositories/payment-method-repository.impl';
import { ProductTypeRepository } from '@features/sales/product-types/domain/repository/product-type-repository';
import { ProductTypeRepositoryImpl } from '@features/sales/product-types/infrastructure/repositories/product-type-repository.impl';
import { SupplierRepository } from '@features/suppliers/domain/repository/supplier-repository';
import { SupplierRepositoryImpl } from '@features/suppliers/infrastructure/repositories/supplier-repository.impl';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { UserRepositoryImpl } from '@features/users/infrastructure/repositories/user-repository.impl';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';
import { ProductRepositoryImpl } from '@features/inventory/infrastructure/repositories/product-repository.impl';
import { ReportRepository } from '@features/reports/domain/repository/report-repository';
import { ReportRepositoryImpl } from '@features/reports/infrastructure/repositories/report-repository.impl';
import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';
import { NotificationRepositoryImpl } from '@features/notifications/infrastructure/repositories/notification-repository.impl';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { BranchRepositoryImpl } from '@features/branches/infrastructure/repositories/branch-repository.impl';
import { InventoryRepository } from '@features/inventory-by-branch/domain/repository/inventory-repository';
import { InventoryRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/inventory-repository.impl';
import { InventoryMovementRepository } from '@features/inventory-by-branch/domain/repository/movement-repository';
import { InventoryMovementRepositoryImpl } from '@features/inventory-by-branch/infrastructure/repositories/movement-repository.impl';
import { SEARCH_STRATEGY } from '@core/search/search.strategy';
import { DefaultSearchStrategy } from '@core/search/default-search.strategy';
import { routes } from '@app/app.routes';
import { SHELL_USER_ROLE } from '@shell/config/shell-user-role.token';
import { NotificationPort } from '@shell/application/ports/notification.port';
import { NotificationService } from '@shell/services/notification.service';
import {
  SHELL_IS_AUTHENTICATED,
  SHELL_LOGOUT,
  SHELL_USERNAME,
} from '@shell/config/shell-auth.token';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Eye,
  EyeClosed,
  EyeOff,
  FileText,
  History,
  House,
  Info,
  LogOut,
  LucideAngularModule,
  Package,
  RefreshCw,
  Search,
  Settings,
  User,
  Users,
  CreditCard,
  BanknoteIcon,
  ArrowLeftRightIcon,
  CircleAlert,
  CircleCheck,
  TriangleAlert,
  OctagonX,
  Trash2,
  X,
  Plus,
  Pencil,
  Edit,
  PlusCircle,
  Tag,
  Barcode,
  Layers,
  DollarSign,
  TrendingUp,
  Archive,
  ShieldCheck,
  Save,
  BarChart3,
  Truck,
  Building,
  MapPin,
  Phone,
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Activity,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor, authTokenInterceptor, trailingSlashInterceptor]),
    ),
    importProvidersFrom(
      LucideAngularModule.pick({
        House,
        History,
        FileText,
        Package,
        Users,
        User,
        Eye,
        EyeClosed,
        EyeOff,
        Bell,
        BellOff,
        Check,
        CheckCheck,
        Info,
        RefreshCw,
        Search,
        Settings,
        LogOut,
        CreditCard,
        BanknoteIcon,
        ArrowLeftRightIcon,
        CircleAlert,
        CircleCheck,
        TriangleAlert,
        OctagonX,
        Trash2,
        X,
        Plus,
        Pencil,
        Edit,
        PlusCircle,
        Tag,
        Barcode,
        Layers,
        DollarSign,
        TrendingUp,
        Archive,
        ShieldCheck,
        Save,
        BarChart3,
        Truck,
        Building,
        MapPin,
        Phone,
        Warehouse,
        ArrowDownLeft,
        ArrowUpRight,
        Hash,
        Activity,
      }),
    ),
    {
      provide: APP_ENV,
      useValue: environment,
    },
    {
      provide: LOGGING_LEVEL_TOKEN,
      useFactory: (env: Environment) => env.production ? LogLevel.ERROR : LogLevel.DEBUG,
      deps: [APP_ENV]
    },
    {
      provide: LOGGER_PORT,
      useExisting: LoggerService,
    },
    {
      provide: STORAGE_PORT,
      useClass: InMemoryStorageService,
    },
    {
      provide: PERSISTENT_STORAGE_PORT,
      useClass: LocalStorageService,
    },
    {
      provide: AuthRepository,
      useClass: AuthRepositoryImpl,
    },
    {
      provide: ProfileRepository,
      useClass: ProfileRepositoryImpl,
    },
    {
      provide: SHELL_USER_ROLE,
      useFactory: (authFacade: AuthFacade) =>
        computed(() => {
          const role = authFacade.role();
          return role ? String(role) : null;
        }),
      deps: [AuthFacade],
    },
    {
      provide: SHELL_USERNAME,
      useFactory: (authFacade: AuthFacade) => authFacade.username,
      deps: [AuthFacade],
    },
    {
      provide: SHELL_IS_AUTHENTICATED,
      useFactory: (authFacade: AuthFacade) => authFacade.isAuthenticated,
      deps: [AuthFacade],
    },
    {
      provide: SHELL_LOGOUT,
      useFactory: (authFacade: AuthFacade) => () => authFacade.logout(),
      deps: [AuthFacade],
    },
    {
      provide: NotificationPort,
      useExisting: NotificationService,
    },
    {
      provide: UserRepository,
      useExisting: UserRepositoryImpl,
    },
    {
      provide: SupplierRepository,
      useExisting: SupplierRepositoryImpl,
    },
    {
      provide: ProductRepository,
      useExisting: ProductRepositoryImpl,
    },
    {
      provide: SaleDetailRepository,
      useExisting: SaleDetailRepositoryImpl,
    },
    {
      provide: SaleRepository,
      useClass: SaleRepositoryImpl,
    },
    {
      provide: PaymentMethodRepository,
      useClass: PaymentMethodRepositoryImpl,
    },
    {
      provide: ProductTypeRepository,
      useClass: ProductTypeRepositoryImpl,
    },
    {
      provide: ReportRepository,
      useClass: ReportRepositoryImpl,
    },
    {
      provide: NotificationRepository,
      useClass: NotificationRepositoryImpl,
    },
    {
      provide: BranchRepository,
      useClass: BranchRepositoryImpl,
    },
    {
      provide: InventoryRepository,
      useClass: InventoryRepositoryImpl,
    },
    {
      provide: InventoryMovementRepository,
      useClass: InventoryMovementRepositoryImpl,
    },
    {
      provide: SEARCH_STRATEGY,
      useClass: DefaultSearchStrategy,
    },
  ],
};
