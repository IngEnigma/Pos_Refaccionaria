import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

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
          },
          error: () => {},
        });
      }
    });
  }
}
