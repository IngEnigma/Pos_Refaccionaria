import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { catchError, finalize, of } from 'rxjs';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';
import { ProductStock } from '@features/inventory/domain/entities/product.entity';
import { SkeletonComponent } from '@shared/ui/components/skeleton/skeleton.component';

@Component({
  selector: 'app-branch-pricing-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './branch-pricing-table.component.html',
  styleUrls: ['./branch-pricing-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchPricingTableComponent {
  private readonly productRepository = inject(ProductRepository);

  readonly sucursalId = input.required<number>();
  readonly setPrice = output<number>();

  readonly products = signal<readonly ProductStock[]>([]);
  readonly loading = signal(false);

  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  constructor() {
    effect(() => {
      const sucursalId = this.sucursalId();
      if (sucursalId) {
        this.loadProducts(sucursalId);
      }
    });
  }

  private loadProducts(sucursalId: number): void {
    this.loading.set(true);

    this.productRepository
      .getProducts({ page: 1, limit: 200 }, { sucursalId })
      .pipe(
        catchError(() => of({ data: [], total: 0, page: 1, pageSize: 200 })),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => {
        this.products.set(response.data as ProductStock[]);
      });
  }

  formatPrice(price: number | null): string {
    if (price === null || price === undefined) return '—';
    return `$${price.toFixed(2)}`;
  }

  getBadgeClass(precioSucursal: number | null): string {
    return precioSucursal !== null ? 'badge-active' : 'badge-inactive';
  }

  getBadgeText(precioSucursal: number | null): string {
    return precioSucursal !== null ? 'Activo' : 'Sin precio';
  }
}
