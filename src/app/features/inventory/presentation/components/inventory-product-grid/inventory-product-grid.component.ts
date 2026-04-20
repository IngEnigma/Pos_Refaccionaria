import { ChangeDetectionStrategy, Component, input, output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

import { Product } from '../../../domain/entities/product.entity';
import { InventoryProductCardComponent } from '../inventory-product-card/inventory-product-card.component';
import { ProductCardSkeletonComponent } from '../../../../../features/sales/presentation/components/product-card/product-card-skeleton.component';

@Component({
  selector: 'app-inventory-product-grid',
  standalone: true,
  imports: [InventoryProductCardComponent, ProductCardSkeletonComponent],
  templateUrl: './inventory-product-grid.component.html',
  styleUrl: './inventory-product-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryProductGridComponent implements AfterViewInit, OnDestroy {
  readonly products = input<readonly Product[]>([]);
  readonly loadingProducts = input(false);
  
  readonly modifyProduct = output<Product>();
  readonly deleteProduct = output<Product>();
  readonly loadMore = output<void>();

  @ViewChild('sentinel') sentinelRef?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;

  readonly skeletonItems = Array.from({ length: 15 }, (_, index) => index);

  ngAfterViewInit(): void {
    if (!this.sentinelRef) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.loadingProducts()) {
          this.loadMore.emit();
        }
      },
      { rootMargin: '200px' }
    );

    this.observer.observe(this.sentinelRef.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
