import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  SalesCartItem,
} from '../../models/sales-ui.models';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
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
  paymentMethods = input<readonly PaymentMethod[]>([]);
  selectedPayment = input<PaymentMethod | null>(null);

  readonly removeItem = output<SalesCartItem>();
  readonly increaseQty = output<SalesCartItem>();
  readonly decreaseQty = output<SalesCartItem>();
  readonly selectPayment = output<PaymentMethod>();
  readonly processTransaction = output<void>();
}
