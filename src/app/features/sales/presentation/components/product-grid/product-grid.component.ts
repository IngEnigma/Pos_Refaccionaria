import { ChangeDetectionStrategy, Component, input, output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

import { SalesProduct } from '../../models/sales-ui.models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../product-card/product-card-skeleton.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [ProductCardComponent, ProductCardSkeletonComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent implements AfterViewInit, OnDestroy {
  readonly products = input<SalesProduct[]>([]);
  readonly loadingProducts = input(false);
  readonly addToCart = output<SalesProduct>();
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
