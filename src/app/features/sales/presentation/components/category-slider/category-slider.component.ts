import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';

import { SkeletonComponent } from '@app/shared/ui/components/skeleton/skeleton.component';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';

@Component({
  selector: 'app-category-slider',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './category-slider.component.html',
  styleUrl: './category-slider.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySliderComponent {
  readonly categories = input<ProductType[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly selectedCategoryId = input<number | null>(null);
  readonly selected = output<ProductType>();

  constructor() {
    effect(() => {
      const cats = this.categories();

      if (!cats.length || this.selectedCategoryId() !== null) return;

      this.selected.emit(cats[0]);
    });
  }

  selectCategory(category: ProductType): void {
    this.selected.emit(category);
  }
}
