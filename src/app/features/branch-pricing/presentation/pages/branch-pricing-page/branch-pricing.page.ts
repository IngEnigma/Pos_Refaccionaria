import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { resolveHttpErrorMessage } from '@features/sales/infrastructure/utils/http-error-resolver';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { BranchesFacade } from '@features/branches/application/facades/branches.facade';
import { BranchPricingFacade } from '../../../application/facades/branch-pricing.facade';
import { BranchPricingTableComponent } from '../../components/branch-pricing-table/branch-pricing-table.component';
import { SetPriceDialogComponent } from '../../components/set-price-dialog/set-price-dialog.component';

@Component({
  selector: 'app-branch-pricing-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DialogModule,
    BranchPricingTableComponent,
  ],
  templateUrl: './branch-pricing.page.html',
  styleUrls: ['./branch-pricing.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchPricingPageComponent implements OnInit {
  readonly branchPricingFacade = inject(BranchPricingFacade);
  private readonly branchesFacade = inject(BranchesFacade);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  private readonly table = viewChild(BranchPricingTableComponent);

  readonly branches = this.branchesFacade.branches;
  readonly selectedSucursalId = this.branchPricingFacade.selectedSucursalId;

  ngOnInit(): void {
    this.branchesFacade.loadBranches();
  }

  onBranchChange(sucursalId: number): void {
    (this.branchPricingFacade as any)._selectedSucursalId.set(sucursalId);
  }

  onSetPrice(event: { productId: number; sucursalId: number }): void {
    const dialogRef = this.dialog.open(SetPriceDialogComponent, {
      data: { idProducto: event.productId, idSucursal: event.sucursalId },
    });

    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.branchPricingFacade.setBranchPrice(result as any).subscribe({
          next: () => {
            this.toastService.success('Precio de sucursal actualizado correctamente');
            this.table()?.reload();
          },
          error: (err: unknown) =>
            this.toastService.error(resolveHttpErrorMessage(err, 'No se pudo actualizar el precio')),
        });
      }
    });
  }

  onDeactivate(event: { productId: number; sucursalId: number }): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar precio',
        message: 'El producto volverá a usar el precio base en esta sucursal. El historial se conserva.',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        variant: 'warning',
      },
    });

    dialogRef.closed.subscribe((confirmed) => {
      if (!confirmed) return;
      this.branchPricingFacade.deactivatePrice(event.productId, event.sucursalId).subscribe({
        next: () => {
          this.toastService.success('Precio de sucursal desactivado');
          this.table()?.reload();
        },
        error: (err: unknown) =>
          this.toastService.error(resolveHttpErrorMessage(err, 'No se pudo desactivar el precio')),
      });
    });
  }
}
