import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../../../../../shared/ui/components/button/button.component';
import { Product } from '../../../domain/entities/product.entity';

@Component({
  selector: 'app-inventory-product-card',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './inventory-product-card.component.html',
  styleUrl: './inventory-product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryProductCardComponent {
  readonly product = input.required<Product>();
  
  readonly modifyProduct = output<Product>();
  readonly deleteProduct = output<Product>();

  onModify(): void {
    this.modifyProduct.emit(this.product());
  }

  onDelete(): void {
    this.deleteProduct.emit(this.product());
  }
}
