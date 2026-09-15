import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { MovementType } from '../../../domain/entities/inventory-movement.entity';

export interface MovementFormDialogData {
  idInventario: number;
  idProducto?: number;
  productName?: string;
  stock?: number;
}

@Component({
  selector: 'app-movement-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
  ],
  templateUrl: './movement-form-dialog.component.html',
  styleUrls: ['./movement-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<{
    idInventario: number;
    tipoMovimiento: MovementType;
    idProducto: number;
    cantidad: number;
    razon: string;
    observaciones?: string;
    idProveedor?: number;
  } | null>);
  readonly data = inject<MovementFormDialogData>(DIALOG_DATA);

  movementForm!: FormGroup;
  readonly movementTypes: { value: MovementType; label: string }[] = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
  ];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.movementForm = this.fb.group({
      tipoMovimiento: ['ENTRADA' as MovementType, [Validators.required]],
      idProducto: [this.data?.idProducto || null, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      razon: ['', [Validators.required, Validators.minLength(3)]],
      observaciones: [''],
      idProveedor: [null],
    });
  }

  get isSalida(): boolean {
    return this.movementForm.get('tipoMovimiento')?.value === 'SALIDA';
  }

  onSubmit(): void {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const value = this.movementForm.value;
    this.dialogRef.close({
      idInventario: this.data.idInventario,
      tipoMovimiento: value.tipoMovimiento,
      idProducto: value.idProducto,
      cantidad: value.cantidad,
      razon: value.razon,
      observaciones: value.observaciones || undefined,
      idProveedor: value.idProveedor || undefined,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.movementForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
