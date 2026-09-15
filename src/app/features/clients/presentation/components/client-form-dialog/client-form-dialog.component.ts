import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Client } from '@features/clients/domain/entities/client.entity';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { CreateClientPayload, UpdateClientPayload } from '@features/clients/domain/repository/client-repository';

export interface ClientFormDialogData {
  client?: Client;
  sucursalId: number | null;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
  ],
  templateUrl: './client-form-dialog.component.html',
  styleUrls: ['./client-form-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(DialogRef<CreateClientPayload | UpdateClientPayload | null>);
  private readonly data = inject<ClientFormDialogData>(DIALOG_DATA);

  clientForm!: FormGroup;
  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.client;
    this.initForm();
  }

  private initForm(): void {
    const c = this.data?.client;
    this.clientForm = this.fb.group({
      nombre: [c?.nombre || '', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: [c?.apellidoPaterno || '', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: [c?.apellidoMaterno || ''],
      telefono: [c?.telefono || '', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,15}$/)]],
      correo: [c?.correo || '', [Validators.email]],
      direccion: [c?.direccion || ''],
      rfc: [c?.rfc || '', [Validators.maxLength(13)]],
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientForm.getRawValue();
    const payload = {
      ...formValue,
      idSucursal: this.data?.sucursalId,
      apellidoMaterno: formValue.apellidoMaterno || null,
      correo: formValue.correo || null,
      direccion: formValue.direccion || null,
      rfc: formValue.rfc || null,
    };

    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  get isFieldInvalid(): (fieldName: string) => boolean {
    return (fieldName: string) => {
      const field = this.clientForm.get(fieldName);
      return !!(field && field.invalid && (field.dirty || field.touched));
    };
  }
}
