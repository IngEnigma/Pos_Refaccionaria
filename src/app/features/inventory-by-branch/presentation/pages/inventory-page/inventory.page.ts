import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

import { ToastService } from '@shared/ui/components/toast/toast.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryByBranchFacade } from '../../../application/facades/inventory-by-branch.facade';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { InventoryTableComponent } from '../../components/inventory-table/inventory-table.component';
import { MovementListComponent } from '../../components/movement-list/movement-list.component';
import { MovementFormDialogComponent } from '../../components/movement-form-dialog/movement-form-dialog.component';

@Component({
  selector: 'app-inventory-by-branch-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DialogModule,
    InventoryTableComponent,
    MovementListComponent,
  ],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryByBranchPageComponent {
  readonly authFacade = inject(AuthFacade);
  readonly inventoryFacade = inject(InventoryByBranchFacade);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  constructor() {
    effect(() => {
      const errorMsg = this.inventoryFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });

    // H-F2-1: tras recargar, la sucursal llega con el perfil (asíncrono); se carga cuando aparece, no solo al iniciar.
    effect(() => {
      if (!this.authFacade.sucursalId()) return;
      untracked(() => {
        this.inventoryFacade.loadMyBranchInventory();
        this.inventoryFacade.loadMovements();
      });
    }, { allowSignalWrites: true });
  }

  onRegisterMovement(item: InventoryItem): void {
    const inventario = this.inventoryFacade.selectedInventory();
    if (!inventario) {
      this.toastService.error('No hay inventario seleccionado');
      return;
    }

    const dialogRef = this.dialog.open(MovementFormDialogComponent, {
      data: {
        idInventario: inventario.idInventario,
        idProducto: item.idProducto,
        productName: item.nombre,
        stock: item.cantidad,
      },
    });

    dialogRef.closed.subscribe((result) => {
      if (!result) return;
      const formValue = result as { idInventario: number; tipoMovimiento: 'ENTRADA' | 'SALIDA'; idProducto: number; cantidad: number; razon: string; observaciones?: string; idProveedor?: number };

      this.inventoryFacade.registerMovement({
        idInventario: formValue.idInventario,
        idSucursal: inventario.idSucursal,
        tipoMovimiento: formValue.tipoMovimiento,
        razon: formValue.razon,
        observaciones: formValue.observaciones,
        idProveedor: formValue.idProveedor,
        items: [{ idProducto: formValue.idProducto, cantidad: formValue.cantidad }],
      }).subscribe({
        next: () => {
          this.toastService.success('Movimiento registrado correctamente');
          this.inventoryFacade.refreshAll();
        },
        error: () => {},
      });
    });
  }

  onAddMovement(): void {
    const inventario = this.inventoryFacade.selectedInventory();
    if (!inventario) {
      this.toastService.error('No hay inventario seleccionado');
      return;
    }

    const dialogRef = this.dialog.open(MovementFormDialogComponent, {
      data: {
        idInventario: inventario.idInventario,
      },
    });

    dialogRef.closed.subscribe((result) => {
      if (!result) return;
      const formValue = result as { idInventario: number; tipoMovimiento: 'ENTRADA' | 'SALIDA'; idProducto: number; cantidad: number; razon: string; observaciones?: string; idProveedor?: number };

      this.inventoryFacade.registerMovement({
        idInventario: formValue.idInventario,
        idSucursal: inventario.idSucursal,
        tipoMovimiento: formValue.tipoMovimiento,
        razon: formValue.razon,
        observaciones: formValue.observaciones,
        idProveedor: formValue.idProveedor,
        items: [{ idProducto: formValue.idProducto, cantidad: formValue.cantidad }],
      }).subscribe({
        next: () => {
          this.toastService.success('Movimiento registrado correctamente');
          this.inventoryFacade.refreshAll();
        },
        error: () => {},
      });
    });
  }
}
