import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Dialog, DialogModule } from '@angular/cdk/dialog';

import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { ClientsFacade } from '../../../application/facades/clients.facade';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ClientsTableComponent } from '../../components/clients-table/clients-table.component';
import { ClientFormDialogComponent } from '../../components/client-form-dialog/client-form-dialog.component';
import { Client } from '../../../domain/entities/client.entity';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DialogModule,
    ClientsTableComponent,
  ],
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent implements OnInit {
  readonly clientsFacade = inject(ClientsFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  readonly sucursalId = this.authFacade.sucursalId;

  constructor() {
    effect(() => {
      const errorMsg = this.clientsFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  ngOnInit(): void {
    this.clientsFacade.loadClients();
  }

  onAddClient(): void {
    const dialogRef = this.dialog.open(ClientFormDialogComponent, {
      data: { sucursalId: this.sucursalId() }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.clientsFacade.createClient(result as any).subscribe({
          next: () => {
            this.toastService.success('Cliente registrado correctamente');
            this.clientsFacade.loadClients();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onEditClient(client: Client): void {
    const dialogRef = this.dialog.open(ClientFormDialogComponent, {
      data: { client, sucursalId: this.sucursalId() }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.clientsFacade.updateClient(client.id, result as any).subscribe({
          next: () => {
            this.toastService.success('Cliente actualizado correctamente');
            this.clientsFacade.loadClients();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }

  onDeleteClient(client: Client): void {
    const fullName = `${client.nombre} ${client.apellidoPaterno}`;
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Cliente',
        message: `¿Estás seguro de que deseas eliminar al cliente "${fullName}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.clientsFacade.deleteClient(client.id).subscribe({
          next: () => {
            this.toastService.success('Cliente eliminado correctamente');
            this.clientsFacade.loadClients();
          },
          error: () => {
            // Error handled by facade
          }
        });
      }
    });
  }
}
