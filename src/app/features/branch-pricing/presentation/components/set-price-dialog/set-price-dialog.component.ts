import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { SetBranchPricePayload } from '@features/branch-pricing/domain/repository/branch-price-repository';

export interface SetPriceDialogData {
  idProducto: number;
  idSucursal: number;
}

@Component({
  selector: 'app-set-price-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
  ],
  templateUrl: './set-price-dialog.component.html',
  styleUrls: ['./set-price-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetPriceDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<SetBranchPricePayload | null>);
  private readonly data = inject<SetPriceDialogData>(DIALOG_DATA);

  readonly priceForm: FormGroup = this.fb.group({
    precioVenta: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  onSubmit(): void {
    if (this.priceForm.invalid) {
      this.priceForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      idProducto: this.data.idProducto,
      idSucursal: this.data.idSucursal,
      precioVenta: this.priceForm.getRawValue().precioVenta,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.priceForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
