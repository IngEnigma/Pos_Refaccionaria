import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { SalesPaymentMethod } from '../../models/sales-ui.models';
import { LucideAngularModule } from "lucide-angular";

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  templateUrl: './payment-method-selector.component.html',
  styleUrl: './payment-method-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
})
export class PaymentMethodSelectorComponent {
  readonly selectedPayment = input<SalesPaymentMethod>('efectivo');
  readonly selectPayment = output<SalesPaymentMethod>();
}
