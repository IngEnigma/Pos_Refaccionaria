import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import { SkeletonComponent } from '@shared/ui/components/skeleton/skeleton.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierListComponent {
  readonly suppliers = input<readonly Supplier[]>([]);
  readonly loading = input(false);
  /** H-F3-2: el back solo deja editar/eliminar a encargado y admin (403 al cajero). */
  readonly canManage = input(true);
  
  readonly edit = output<Supplier>();
  readonly delete = output<Supplier>();

  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);
}
