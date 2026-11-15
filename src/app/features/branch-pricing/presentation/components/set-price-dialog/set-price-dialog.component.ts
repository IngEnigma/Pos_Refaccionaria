import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { isValidBranchPrice } from '@features/branch-pricing/domain/rules/branch-price.rule';
import { SetBranchPricePayload } from '@features/branch-pricing/domain/repository/branch-price-repository';

export interface SetPriceDialogData {
  idProducto: number;
  idSucursal: number;
}

// H-14: 2 decimales máx., tope del backend y valores no numéricos fijados por código.
function priceFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return value === null || value === '' || isValidBranchPrice(value) ? null : { precio: true };
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
    precioVenta: [null as number | null, [Validators.required, Validators.min(0.01), priceFormatValidator]],
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
