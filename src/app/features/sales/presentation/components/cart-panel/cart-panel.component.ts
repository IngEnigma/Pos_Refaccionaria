import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  SalesCartItem,
  SalesPaymentMethod,
} from '../../models/sales-ui.models';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { PaymentMethodSelectorComponent } from '../payment-method-selector/payment-method-selector.component';
import { SalesSummaryComponent } from '../sales-summary/sales-summary.component';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [CartItemComponent, SalesSummaryComponent, PaymentMethodSelectorComponent],
  templateUrl: './cart-panel.component.html',
  styleUrl: './cart-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPanelComponent {
  readonly cartItems = input<SalesCartItem[]>([]);
  readonly subtotal = input(0);
  readonly descuento = input(0);
  readonly iva = input(0);
  readonly total = input(0);
  readonly selectedPayment = input<SalesPaymentMethod | null>(null);

  readonly removeItem = output<SalesCartItem>();
  readonly increaseQty = output<SalesCartItem>();
  readonly decreaseQty = output<SalesCartItem>();
  readonly selectPayment = output<SalesPaymentMethod>();
  readonly processTransaction = output<void>();
}

