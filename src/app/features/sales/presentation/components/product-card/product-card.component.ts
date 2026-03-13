import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SalesProduct } from '../../models/sales-ui.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<SalesProduct>();
  readonly addToCart = output<SalesProduct>();

  onAdd(): void {
    this.addToCart.emit(this.product());
  }
}
