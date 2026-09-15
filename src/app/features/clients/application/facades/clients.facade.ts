import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { GetClientsUseCase } from '../usecase/get-clients.usecase';
import { CreateClientUseCase } from '../usecase/create-client.usecase';
import { UpdateClientUseCase } from '../usecase/update-client.usecase';
import { DeleteClientUseCase } from '../usecase/delete-client.usecase';
import { Client } from '../../domain/entities/client.entity';
import {
  CreateClientPayload,
  UpdateClientPayload,
} from '../../domain/repository/client-repository';

@Injectable({ providedIn: 'root' })
export class ClientsFacade {
  private readonly getClientsUseCase = inject(GetClientsUseCase);
  private readonly createClientUseCase = inject(CreateClientUseCase);
  private readonly updateClientUseCase = inject(UpdateClientUseCase);
  private readonly deleteClientUseCase = inject(DeleteClientUseCase);
  private readonly logger = inject(LoggerService).withContext('ClientsFacade');

  private readonly _clients = signal<readonly Client[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly clients = this._clients.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadClients(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getClientsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load clients', { message });
          return of([]);
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((clients) => {
        this._clients.set(clients);
      });
  }

  createClient(payload: CreateClientPayload): Observable<Client> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.createClientUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to create client', { message, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  updateClient(id: number, payload: UpdateClientPayload): Observable<Client> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.updateClientUseCase.execute(id, payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to update client', { message, id, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  deleteClient(id: number): Observable<void> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.deleteClientUseCase.execute(id).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to delete client', { message, id });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.error?.error || error.message || 'No fue posible completar la operación.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Ocurrió un error inesperado.';
  }
}
