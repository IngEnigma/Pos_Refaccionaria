import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClientsFacade } from '@features/clients/application/facades/clients.facade';
import { Client } from '@features/clients/domain/entities/client.entity';

/**
 * Modal para elegir el cliente de la venta actual.
 * - select emite el cliente elegido o null (Público general).
 * - close emite al cancelar/cerrar sin cambiar la selección.
 */
@Component({
  selector: 'app-client-selector-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-selector-modal.component.html',
  styleUrl: './client-selector-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientSelectorModalComponent {
  readonly selectedClient = input<Client | null>(null);

  readonly close = output<void>();
  readonly select = output<Client | null>();

  private readonly clientsFacade = inject(ClientsFacade);

  readonly clients = this.clientsFacade.clients;
  readonly loading = this.clientsFacade.loading;
  readonly errorMessage = this.clientsFacade.errorMessage;
  readonly searchQuery = signal('');

  constructor() {
    this.clientsFacade.loadClients();
  }

  /** Filtrado local por nombre, apellidos y teléfono (case-insensitive, con trim). */
  readonly filteredClients = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const clients = this.clients();
    if (!query) return clients;

    return clients.filter((client) => {
      const nombre = `${client.nombre} ${client.apellidoPaterno} ${client.apellidoMaterno ?? ''}`
        .toLowerCase()
        .trim();
      return nombre.includes(query) || client.telefono.toLowerCase().includes(query);
    });
  });

  onSelect(client: Client | null): void {
    this.select.emit(client);
  }

  onCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  displayName(client: Client): string {
    return `${client.nombre} ${client.apellidoPaterno} ${client.apellidoMaterno ?? ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }
}
