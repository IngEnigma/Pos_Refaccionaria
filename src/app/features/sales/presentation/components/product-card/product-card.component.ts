import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { LucideAngularModule } from 'lucide-angular';
import { SalesProduct } from '../../models/sales-ui.models';
import { ButtonComponent } from '../../../../../shared/ui/components/button/button.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ButtonComponent, LucideAngularModule],
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
