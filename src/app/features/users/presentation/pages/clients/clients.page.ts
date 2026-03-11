import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface Client {
  id: string;
  nombre: string;
  emails: string[];
  telefonos: string[];
  saldo: number;
  credito: number;
}

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.table.css', './clients.page.modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent {
  private readonly fb = inject(FormBuilder);

  clients: Client[] = [
    {
      id: 'CLI-001',
      nombre: 'Taller Mecánico El Tuercas',
      emails: ['contacto@eltuercas.com', 'pagos@eltuercas.com'],
      telefonos: ['55-1234-5678'],
      saldo: 1500,
      credito: 5000,
    },
    {
      id: 'CLI-002',
      nombre: 'Juan Pérez Transportes',
      emails: ['juan.perez@gmail.com'],
      telefonos: ['55-8765-4321', '55-9999-0000'],
      saldo: 0,
      credito: 10000,
    },
  ];

  isModalOpen = false;
  editingClientId: string | null = null;

  readonly clientForm = this.fb.group({
    nombre: ['', Validators.required],
    emails: this.fb.array([]),
    telefonos: this.fb.array([]),
    saldo: [0, [Validators.min(0)]],
    credito: [0, [Validators.min(0)]],
  });

  get emails(): FormArray {
    return this.clientForm.get('emails') as FormArray;
  }

  get telefonos(): FormArray {
    return this.clientForm.get('telefonos') as FormArray;
  }

  addEmail(email = ''): void {
    this.emails.push(this.fb.control(email, [Validators.email, Validators.required]));
  }

  removeEmail(index: number): void {
    this.emails.removeAt(index);
  }

  addTelefono(telefono = ''): void {
    this.telefonos.push(this.fb.control(telefono, Validators.required));
  }

  removeTelefono(index: number): void {
    this.telefonos.removeAt(index);
  }

  openModal(client?: Client): void {
    this.isModalOpen = true;
    this.clientForm.reset();
    this.emails.clear();
    this.telefonos.clear();

    if (client) {
      this.editingClientId = client.id;
      this.clientForm.patchValue({
        nombre: client.nombre,
        saldo: client.saldo,
        credito: client.credito,
      });
      client.emails.forEach((email) => this.addEmail(email));
      client.telefonos.forEach((telefono) => this.addTelefono(telefono));
      return;
    }

    this.editingClientId = null;
    this.addEmail();
    this.addTelefono();
    this.clientForm.patchValue({ saldo: 0, credito: 0 });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingClientId = null;
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formVal = this.clientForm.getRawValue();

    if (this.editingClientId) {
      const index = this.clients.findIndex((client) => client.id === this.editingClientId);
      if (index !== -1) {
        this.clients[index] = {
          ...this.clients[index],
          nombre: formVal.nombre ?? '',
          emails: formVal.emails as string[],
          telefonos: formVal.telefonos as string[],
          saldo: Number(formVal.saldo ?? 0),
          credito: Number(formVal.credito ?? 0),
        };
      }
      this.closeModal();
      return;
    }

    const newClient: Client = {
      id: `CLI-${Date.now()}`,
      nombre: formVal.nombre ?? '',
      emails: formVal.emails as string[],
      telefonos: formVal.telefonos as string[],
      saldo: Number(formVal.saldo ?? 0),
      credito: Number(formVal.credito ?? 0),
    };

    this.clients = [newClient, ...this.clients];
    this.closeModal();
  }

  deleteClient(client: Client): void {
    if (!window.confirm(`¿Estás seguro de eliminar a "${client.nombre}"?`)) {
      return;
    }

    this.clients = this.clients.filter((item) => item.id !== client.id);
  }
}
