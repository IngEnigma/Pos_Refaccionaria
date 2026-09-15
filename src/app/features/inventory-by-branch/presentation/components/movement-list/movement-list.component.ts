import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryMovement, MovementType } from '../../../domain/entities/inventory-movement.entity';

@Component({
  selector: 'app-movement-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementListComponent {
  readonly movements = input.required<readonly InventoryMovement[]>();
  readonly loading = input<boolean>(false);

  movementIcon(type: MovementType): string {
    switch (type) {
      case 'ENTRADA': return 'ArrowDownLeft';
      case 'SALIDA': return 'ArrowUpRight';
      default: return 'Activity';
    }
  }

  movementLabel(type: MovementType): string {
    switch (type) {
      case 'ENTRADA': return 'Entrada';
      case 'SALIDA': return 'Salida';
      default: return type;
    }
  }

  movementClass(type: MovementType): string {
    switch (type) {
      case 'ENTRADA': return 'entrada';
      case 'SALIDA': return 'salida';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
