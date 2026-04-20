import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { CreateSupplierPayload, UpdateSupplierPayload } from '@features/suppliers/domain/repository/supplier-repository';

export interface SupplierFormDialogData {
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent
  ],
  templateUrl: './supplier-form-dialog.component.html',
  styleUrls: ['./supplier-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<CreateSupplierPayload | UpdateSupplierPayload | null>);
  private readonly data = inject<SupplierFormDialogData>(DIALOG_DATA);

  supplierForm!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.supplier;
    this.initForm();
  }

  private initForm(): void {
    const s = this.data?.supplier;
    this.supplierForm = this.fb.group({
      nombre: [s?.nombre || '', [Validators.required, Validators.minLength(3)]],
      direccion: [s?.direccion || '', [Validators.required]],
      telefono: [s?.telefono || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      correo: [s?.correo || '', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.supplierForm.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.supplierForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
