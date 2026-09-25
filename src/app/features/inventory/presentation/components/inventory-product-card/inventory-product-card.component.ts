import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../../../../../shared/ui/components/button/button.component';
import { Product } from '../../../domain/entities/product.entity';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';

type CardProduct = Product | InventoryItem;

function isInventoryItem(p: CardProduct): p is InventoryItem {
  return 'cantidad' in p && 'precioSucursal' in p;
}

@Component({
  selector: 'app-inventory-product-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  templateUrl: './inventory-product-card.component.html',
  styleUrl: './inventory-product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryProductCardComponent {
  readonly product = input.required<CardProduct>();

  readonly modifyProduct = output<CardProduct>();
  readonly deleteProduct = output<CardProduct>();
  readonly changePrice = output<CardProduct>();

  readonly effectivePrice = computed(() => {
    const p = this.product();
    if (isInventoryItem(p)) return p.precioSucursal ?? p.precioBase;
    return (p as Product).precioVenta;
  });

  readonly hasSucursalPrice = computed(() => {
    const p = this.product();
    return isInventoryItem(p) ? p.precioSucursal !== null : false;
  });

  readonly stock = computed(() => {
    const p = this.product();
    return isInventoryItem(p) ? p.cantidad : null;
  });

  readonly isLowStock = computed(() => {
    const s = this.stock();
    return s !== null && s <= 5;
  });

  onModify(): void {
    this.modifyProduct.emit(this.product());
  }

  onDelete(): void {
    this.deleteProduct.emit(this.product());
  }

  onChangePrice(): void {
    this.changePrice.emit(this.product());
  }
}
