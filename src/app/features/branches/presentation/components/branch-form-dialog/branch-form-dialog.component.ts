import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { CreateBranchPayload, UpdateBranchPayload } from '@features/branches/domain/repository/branch-repository';

export interface BranchFormDialogData {
  branch?: Branch;
}

@Component({
  selector: 'app-branch-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent
  ],
  templateUrl: './branch-form-dialog.component.html',
  styleUrls: ['./branch-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<CreateBranchPayload | UpdateBranchPayload | null>);
  readonly data = inject<BranchFormDialogData>(DIALOG_DATA);

  branchForm!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.branch;
    this.initForm();
  }

  private initForm(): void {
    const b = this.data?.branch;
    this.branchForm = this.fb.group({
      nombreSucursal: [b?.nombreSucursal || '', [Validators.required, Validators.minLength(3)]],
      ubicacion: [b?.ubicacion || '', [Validators.required]],
      codigoPostal: [b?.codigoPostal || '', [Validators.required]],
      numeroTelefono: [b?.numeroTelefono || '', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      correoElectronico: [b?.correoElectronico || '', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.branchForm.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.branchForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
