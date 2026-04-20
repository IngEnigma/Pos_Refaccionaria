import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SkeletonComponent } from '@shared/ui/components/skeleton/skeleton.component';

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './product-card-skeleton.component.html',
  styleUrl: './product-card-skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardSkeletonComponent {}
