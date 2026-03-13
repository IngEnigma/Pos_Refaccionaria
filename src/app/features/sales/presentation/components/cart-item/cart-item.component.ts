import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SalesCartItem } from '../../models/sales-ui.models';
import { QuantityControlComponent } from '../quantity-control/quantity-control.component';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [QuantityControlComponent, LucideAngularModule],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  readonly item = input.required<SalesCartItem>();
  readonly remove = output<SalesCartItem>();
  readonly increaseQty = output<SalesCartItem>();
  readonly decreaseQty = output<SalesCartItem>();
}
