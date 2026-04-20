import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
