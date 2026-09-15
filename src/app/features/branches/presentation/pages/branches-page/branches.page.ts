import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { BranchesFacade } from '../../../application/facades/branches.facade';
import { BranchCardComponent } from '../../components/branch-card/branch-card.component';
import { BranchFormDialogComponent } from '../../components/branch-form-dialog/branch-form-dialog.component';
import { Branch } from '../../../domain/entities/branch.entity';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DialogModule,
    BranchCardComponent
  ],
  templateUrl: './branches.page.html',
  styleUrls: ['./branches.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchesPageComponent implements OnInit {
  readonly branchesFacade = inject(BranchesFacade);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  constructor() {
    effect(() => {
      const errorMsg = this.branchesFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  ngOnInit(): void {
    this.branchesFacade.loadBranches();
  }

  onAddBranch(): void {
    const dialogRef = this.dialog.open(BranchFormDialogComponent, {
      data: {}
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.branchesFacade.createBranch(result as any).subscribe({
          next: () => {
            this.toastService.success('Sucursal registrada correctamente');
            this.branchesFacade.loadBranches();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onEditBranch(branch: Branch): void {
    const dialogRef = this.dialog.open(BranchFormDialogComponent, {
      data: { branch }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.branchesFacade.updateBranch(branch.id, result as any).subscribe({
          next: () => {
            this.toastService.success('Sucursal actualizada correctamente');
            this.branchesFacade.loadBranches();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onDeleteBranch(branch: Branch): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Sucursal',
        message: `¿Estás seguro de que deseas eliminar la sucursal "${branch.nombreSucursal}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.branchesFacade.deleteBranch(branch.id).subscribe({
          next: () => {
            this.toastService.success('Sucursal eliminada correctamente');
            this.branchesFacade.loadBranches();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }
}
