import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authTokenInterceptor } from '@features/auth/infrastructure/http/auth-token.interceptor';
import { httpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { STORAGE_PORT } from '@core/ports/storage.port';
import { LocalStorageService } from '@core/services/local-storage.service';
import { APP_ENV } from '@core/tokens/app-env.token';
import { environment } from '@env/environment';
import { AuthRepository } from '@features/auth/domain/repository/auth-repository';
import { AuthRepositoryImpl } from '@features/auth/infrastructure/repositories/auth-repository.impl';
import { MovementRepository } from '@features/movements/domain/repository/movement-repository';
import { MovementRepositoryImpl } from '@features/movements/infrastructure/repositories/movement-repository.impl';
import { PaymentMethodRepository } from '@features/payment-methods/domain/repository/payment-method-repository';
import { PaymentMethodRepositoryImpl } from '@features/payment-methods/infrastructure/repositories/payment-method-repository.impl';
import { ProductTypeRepository } from '@features/product-types/domain/repository/product-type-repository';
import { ProductTypeRepositoryImpl } from '@features/product-types/infrastructure/repositories/product-type-repository.impl';
import { SaleDetailRepository } from '@features/sale-details/domain/repository/sale-detail-repository';
import { SaleDetailRepositoryImpl } from '@features/sale-details/infrastructure/repositories/sale-detail-repository.impl';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleRepositoryImpl } from '@features/sales/infrastructure/repositories/sale-repository.impl';
import { SupplierRepository } from '@features/suppliers/domain/repository/supplier-repository';
import { SupplierRepositoryImpl } from '@features/suppliers/infrastructure/repositories/supplier-repository.impl';
import { UserRepository } from '@features/users/domain/repository/user-repository';
import { UserRepositoryImpl } from '@features/users/infrastructure/repositories/user-repository.impl';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';
import { ProductRepositoryImpl } from '@features/inventory/infrastructure/repositories/product-repository.impl';
import { routes } from '@app/app.routes';
import {
  Bell,
  Eye,
  EyeClosed,
  EyeOff,
  FileText,
  History,
  House,
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
  X,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor, authTokenInterceptor]),
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
        RefreshCw,
        Search,
        Settings,
        LogOut,
        CreditCard,
        BanknoteIcon,
        ArrowLeftRightIcon,
        X,
      }),
    ),
    {
      provide: APP_ENV,
      useValue: environment,
    },
    {
      provide: STORAGE_PORT,
      useExisting: LocalStorageService,
    },
    {
      provide: AuthRepository,
      useExisting: AuthRepositoryImpl,
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
      provide: ProductTypeRepository,
      useExisting: ProductTypeRepositoryImpl,
    },
    {
      provide: PaymentMethodRepository,
      useExisting: PaymentMethodRepositoryImpl,
    },
    {
      provide: MovementRepository,
      useExisting: MovementRepositoryImpl,
    },
    {
      provide: SaleDetailRepository,
      useExisting: SaleDetailRepositoryImpl,
    },
    {
      provide: SaleRepository,
      useExisting: SaleRepositoryImpl,
    },
  ],
};
