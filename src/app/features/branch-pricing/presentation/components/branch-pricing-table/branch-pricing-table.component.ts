import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { GlobalSearchService } from '@core/search/global-search.service';
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
  readonly deactivatePrice = output<number>();

  readonly products = signal<readonly ProductStock[]>([]);
  private readonly globalSearch = inject(GlobalSearchService);
  /** Filtrado con el buscador del navbar. */
  readonly visibleProducts = computed(() => this.globalSearch.search([...this.products()]));
  readonly loading = signal(false);

  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  constructor() {
    effect(() => {
      const sucursalId = this.sucursalId();
      if (sucursalId) {
        untracked(() => this.loadProducts(sucursalId)); // H-33: loadProducts escribe señales
      }
    });
  }

  /** Vuelve a consultar los precios de la sucursal actual (H-35: tras fijar un precio). */
  reload(): void {
    const sucursalId = this.sucursalId();
    if (sucursalId) this.loadProducts(sucursalId);
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
    if (!this.hasPrice(price)) return '—';
    return `$${(price as number).toFixed(2)}`;
  }

  /** H-36: un NaN cuenta como sin precio. */
  hasPrice(price: number | null | undefined): boolean {
    return price !== null && price !== undefined && !Number.isNaN(price);
  }

  getBadgeClass(precioSucursal: number | null): string {
    return this.hasPrice(precioSucursal) ? 'badge-active' : 'badge-inactive';
  }

  getBadgeText(precioSucursal: number | null): string {
    return this.hasPrice(precioSucursal) ? 'Activo' : 'Sin precio';
  }
}
