import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';

@Component({
  selector: 'app-inventory-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryTableComponent {
  readonly items = input.required<readonly InventoryItem[]>();
  readonly loading = input<boolean>(false);

  readonly registerMovement = output<InventoryItem>();
}
