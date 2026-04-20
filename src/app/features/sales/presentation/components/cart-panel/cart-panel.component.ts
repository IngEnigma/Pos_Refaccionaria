import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  SalesCartItem,
} from '@features/sales/presentation/models/sales-ui.models';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { CartItemComponent } from '@features/sales/presentation/components/cart-item/cart-item.component';
import { PaymentMethodSelectorComponent } from '@features/sales/presentation/components/payment-method-selector/payment-method-selector.component';
import { SalesSummaryComponent } from '@features/sales/presentation/components/sales-summary/sales-summary.component';
import { ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [CartItemComponent, SalesSummaryComponent, PaymentMethodSelectorComponent, ButtonComponent],
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
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly removeItem = output<SalesCartItem>();
  readonly increaseQty = output<SalesCartItem>();
  readonly decreaseQty = output<SalesCartItem>();
  readonly selectPayment = output<PaymentMethod>();
  readonly processTransaction = output<void>();
}
