import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { filter, switchMap } from 'rxjs';

import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { BranchesFacade } from '../../../application/facades/branches.facade';
import { BranchCardComponent } from '../../components/branch-card/branch-card.component';
import { BranchFormDialogComponent } from '../../components/branch-form-dialog/branch-form-dialog.component';
import { CreateBranchPayload, UpdateBranchPayload } from '../../../domain/repository/branch-repository';
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
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.branchesFacade.loadBranches();
  }

  onAddBranch(): void {
    this.dialog
      .open<CreateBranchPayload | null>(BranchFormDialogComponent, { data: {} })
      .closed.pipe(
        filter((result): result is CreateBranchPayload => !!result),
        switchMap((payload) => this.branchesFacade.createBranch(payload)),
      )
      .subscribe({
        next: () => this.afterChange('Sucursal registrada correctamente'),
        error: () => undefined, // el error lo expone la facade
      });
  }

  onEditBranch(branch: Branch): void {
    this.dialog
      .open<UpdateBranchPayload | null>(BranchFormDialogComponent, { data: { branch } })
      .closed.pipe(
        filter((result): result is UpdateBranchPayload => !!result),
        switchMap((payload) => this.branchesFacade.updateBranch(branch.id, payload)),
      )
      .subscribe({
        next: () => this.afterChange('Sucursal actualizada correctamente'),
        error: () => undefined, // el error lo expone la facade
      });
  }

  private afterChange(message: string): void {
    this.toastService.success(message);
    this.branchesFacade.loadBranches();
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

    dialogRef.closed
      .pipe(
        filter(Boolean),
        switchMap(() => this.branchesFacade.deleteBranch(branch.id)),
      )
      .subscribe({
        next: () => this.afterChange('Sucursal eliminada correctamente'),
        error: () => undefined, // el error lo expone la facade
      });
  }
}
