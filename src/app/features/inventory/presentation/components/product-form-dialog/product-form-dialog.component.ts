import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { ProductTypesFacade } from '@features/sales';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { CreateProductPayload, UpdateProductPayload } from '@features/inventory/domain/repository/product-repository';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrls: ['./product-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<CreateProductPayload | UpdateProductPayload | null>);
  private readonly data = inject<ProductFormDialogData>(DIALOG_DATA);
  readonly productTypesFacade = inject(ProductTypesFacade);

  productForm!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.product;
    this.initForm();
    this.productTypesFacade.loadProductTypes();
  }

  private initForm(): void {
    const p = this.data?.product;
    this.productForm = this.fb.group({
      nombre: [p?.nombre || '', [Validators.required, Validators.minLength(3)]],
      clave: [p?.clave || '', [Validators.required]],
      codigoBarras: [p?.codigoBarras || '', [Validators.required]],
      idTipo: [p?.idTipo || null, [Validators.required]],
      precioVenta: [p?.precioVenta || 0, [Validators.required, Validators.min(0)]],
      costo: [p?.costo || 0, [Validators.required, Validators.min(0)]],
      existencia: [p?.existencia || 0, [Validators.required, Validators.min(0)]],
      marca: [p?.marca || '', [Validators.required]],
      descripcion: [p?.descripcion || ''],
      codigoSat: [p?.codigoSat || ''],
      idProveedor: [p?.idProveedor || null],
      idMovimientos: [p?.idMovimientos || null],
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.productForm.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.productForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
