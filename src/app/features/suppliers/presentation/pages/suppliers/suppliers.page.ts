import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { SuppliersFacade } from '../../../application/facades/suppliers.facade';
import { SupplierListComponent } from '../../components/supplier-list/supplier-list.component';
import { SupplierFormDialogComponent } from '../../components/supplier-form-dialog/supplier-form-dialog.component';
import { Supplier } from '../../../domain/entities/supplier.entity';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DialogModule,
    SupplierListComponent
  ],
  templateUrl: './suppliers.page.html',
  styleUrls: ['./suppliers.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersPageComponent implements OnInit {
  readonly suppliersFacade = inject(SuppliersFacade);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  constructor() {
    effect(() => {
      const errorMsg = this.suppliersFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  ngOnInit(): void {
    this.suppliersFacade.loadSuppliers();
  }

  onAddSupplier(): void {
    const dialogRef = this.dialog.open(SupplierFormDialogComponent, {
      data: {}
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.suppliersFacade.createSupplier(result as any).subscribe({
          next: () => {
            this.toastService.success('Proveedor registrado correctamente');
            this.suppliersFacade.loadSuppliers();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onEditSupplier(supplier: Supplier): void {
    const dialogRef = this.dialog.open(SupplierFormDialogComponent, {
      data: { supplier }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.suppliersFacade.updateSupplier(supplier.id, result as any).subscribe({
          next: () => {
            this.toastService.success('Proveedor actualizado correctamente');
            this.suppliersFacade.loadSuppliers();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onDeleteSupplier(supplier: Supplier): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Proveedor',
        message: `¿Estás seguro de que deseas eliminar al proveedor "${supplier.nombre}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.suppliersFacade.deleteSupplier(supplier.id).subscribe({
          next: () => {
            this.toastService.success('Proveedor eliminado correctamente');
            this.suppliersFacade.loadSuppliers();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }
}
