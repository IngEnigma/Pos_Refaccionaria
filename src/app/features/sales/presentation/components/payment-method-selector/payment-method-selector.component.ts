import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';

import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  templateUrl: './payment-method-selector.component.html',
  styleUrl: './payment-method-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
})
export class PaymentMethodSelectorComponent {
  paymentMethods = input<readonly PaymentMethod[]>([]);
  selectedPayment = input<PaymentMethod | null>(null);
  selectPayment = output<PaymentMethod>();

  constructor() {
    effect(() => {
      const methods = this.paymentMethods();

      if (!methods.length || this.selectedPayment()) return;

      const efectivo = methods.find(m =>
        m.tipo.toLowerCase().includes('efectivo')
      );

      if (efectivo) {
        this.selectPayment.emit(efectivo);
      }
    });
  }

  resolveIcon(method: PaymentMethod): string {
    const tipo = method.tipo.toLowerCase();
    if (tipo.includes('tarjeta')) return 'CreditCard';
    if (tipo.includes('transfer')) return 'ArrowLeftRightIcon';
    return 'BanknoteIcon';
  }
}
